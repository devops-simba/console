import * as _ from 'lodash'
import * as React from 'react'
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps
} from '../factory/modal';
import {
  Dropdown,
  PromiseComponent,
  PromiseComponentState,
  history,
  resourceObjPath,
} from '../utils';
import {
  K8sKind,
  K8sResourceKind,
  k8sUpdate,
  referenceFor,
} from '../../module/k8s/';

import { Zone } from '../../devops-simba/types';
import { getZones, findZone } from '../../devops-simba/utils';
import { CheckboxGroup } from '../../devops-simba/components/checkbox-group';
import { enabledZones, projectEnvironments } from '../../devops-simba/constants';

/* eslint-disable promise/catch-or-return */

const DISPLAY_NAME_ANNOTATION = 'openshift.io/display-name'
const DESCRIPTION_ANNOTATION = 'openshift.io/description'

function extractZoneAndEnv(
  resource: K8sResourceKind,
  availableZones: Zone[],
  desc: string
  ): [string, string, Zone[]] {
  let env: string;
  let selectedZones: Zone[];
  if (desc) {
    const i = desc.lastIndexOf(' ^^{');
    if (i !== -1) {
      // try to parse this as JSON
      const s = desc.substr(i+3);
      try {
        const o = JSON.parse(s);
        env = _.get(o, 'env', null);
        const zones = _.get(o, 'zones', null);
        if (env !== null && zones !== null) {
          if (_.get(projectEnvironments, env, '') === '') {
            env = '';
          }

          desc = desc.substring(0, i);
          selectedZones = zones.map((z: string) => findZone(z));
          if (!selectedZones.find((z: Zone) => z === null)) {
            // env & zones are valid and embedded in the description
            return [desc, env, selectedZones];
          } else {
            return [desc, env, []];
          }
        }
      } catch (unused) {
        /* eslint-disable no-console */
        console.warn(`DBG.extractZoneAndEnv.catch(${unused.message})`)
      }
    }
  }

  env = _.get(resource, 'metadata.labels.environment', 'test');
  try {
    selectedZones = getZones(resource);
    if (selectedZones === null) {
      selectedZones = availableZones;
    }
  } catch (unused) {
    selectedZones = availableZones;
  }
  return [desc, env, selectedZones];
};

class EditNamespaceModal extends PromiseComponent<EditNamespaceModalProps, EditNamespaceModalState> {
  constructor(props: EditNamespaceModalProps) {
    super(props);
    const displayName = _.get(this.props.resource, `metadata.annotations["${DISPLAY_NAME_ANNOTATION}"]`, '');
    const [description, env, selectedZones] = extractZoneAndEnv(
      props.resource, enabledZones,
      _.get(props.resource, `metadata.annotations["${DESCRIPTION_ANNOTATION}"]`, ''));
    Object.assign(this.state, {
      availableZones: enabledZones,
      selectedZones,
      description,
      env,
      displayName,
    });
  }

  _handleChange(event: React.ChangeEvent<HTMLInputElement>|React.ChangeEvent<HTMLTextAreaElement>) {
    const name = event.target.name;
    const value = event.target.value;
    this.setState({[name]: value} as any)
  }

  async _editProject() {
    const { displayName, selectedZones, description, env } = this.state;
    if (_.isEmpty(selectedZones)) {
      throw Error('Please select at least one zone');
    }
    if (_.isEmpty(env)) {
      throw Error('Please select an environment');
    }

    let updatedObject = Object.assign({}, this.props.resource);
    // update annotations to include possible updated display name and/or zones
    let annotations = Object.assign({}, _.get(updatedObject, 'metadata.annotations', {}));
    annotations[DISPLAY_NAME_ANNOTATION] = displayName;
    annotations[DESCRIPTION_ANNOTATION] = `${description || ''} ^^${JSON.stringify({
      env: env.toLowerCase(),
      zones: selectedZones.map((z: Zone) => z.zoneIndicator),
    })}`;
    _.set(updatedObject, 'metadata.annotations', annotations);

    // now actually updated the object
    return await k8sUpdate(this.props.kind, updatedObject);
  }
  _submit(event: React.FormEvent<EventTarget>) {
    event.preventDefault();

    const { close, onSubmit } = this.props;
    const promise = this._editProject();
    this.handlePromise(promise).then(
      (obj) => {
        close();
        if (onSubmit) {
          onSubmit(obj);
        } else {
          history.push(resourceObjPath(obj, referenceFor(obj)));
        }
      },
    );
  }

  render() {
    const { displayName } = this.state;
    const { resource, kind } = this.props;
    const name = _.get(this.props.resource, 'metadata.name', '');
    return (
      <form
        onSubmit={this._submit.bind(this)}
        name="form"
        className="modal-content modal-content--no-inner-scroll">
        <ModalTitle>
          <div className="name-label-header">
            <span>EditProject</span>
            <a href={`${resourceObjPath(resource, kind.kind)}/yaml`} title="Edit project as YAML">YAML</a>
          </div>
        </ModalTitle>
        <ModalBody>
          <div className="form-group">
            <label htmlFor="input-name" className="control-label">Name</label>
            <div className="modal-body__field">
              <input
                id="input-name"
                data-test="input-name"
                name="name"
                type="text"
                className="pf-c-form-control"
                value={name}
                disabled={true}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="input-display-name" className="control-label">Display Name</label>
            <div className="modal-body__field">
              <input
                id="input-display-name"
                name="displayName"
                type="text"
                className="pf-c-form-control"
                onChange={this._handleChange.bind(this)}
                value={displayName}
                autoFocus
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="input-description" className="control-label">Description</label>
            <div className="modal-body__field">
              <textarea
                id="input-description"
                name="description"
                className="pf-c-form-control"
                onChange={this._handleChange.bind(this)}
                value={this.state.description || ''}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="dropdown-environment" className="control-label">Environment</label>
            <div className="modal-body__environment">
              <Dropdown
                id="dropdown-environment"
                items={projectEnvironments}
                selectedKey={this.state.env}
                dropDownClassName="dropdown--full-width"
                onChange={(env) => this.setState({ env })}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="checkbox-zones" className="control-label">Zones</label>
            <div className="modal-body__zones">
              <CheckboxGroup
                availableItems={this.state.availableZones}
                selectedItems={this.state.selectedZones}
              />
            </div>
          </div>
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={this.state.errorMessage}
          inProgress={this.state.inProgress}
          submitText="Create"
          cancel={this.props.cancel.bind(this)}
        />
      </form>
    );
  }
};

export type EditNamespaceModalProps = {
  kind: K8sKind;
  resource: K8sResourceKind;
  onSubmit?: (resource: K8sResourceKind) => void;
} & ModalComponentProps;
export type EditNamespaceModalState = {
  env: string;
  displayName: string;
  description: string;
  availableZones: Zone[];
  selectedZones: Zone[];
} & PromiseComponentState;

export const editProjectModal = createModalLauncher(EditNamespaceModal);
