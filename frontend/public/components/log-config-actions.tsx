import * as _ from 'lodash';
import * as React from 'react';
import {
  MinusCircleIcon,
  PlusCircleIcon,
} from '@patternfly/react-icons';
import {
  Flex,
  FlexItem,
  Tooltip,
  Button,
  ButtonVariant,
  ButtonType,
} from '@patternfly/react-core';

import {
  KebabAction,
  PromiseComponent,
  PromiseComponentState,
  NumberSpinner
} from './utils';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
  createModalLauncher,
} from './factory'
import {
  K8sKind,
  K8sResourceKind,
  k8sUpdate,
} from '../module/k8s';

const MAX_ILM = 6;

type configureLoggingProps = {
  kind: K8sKind,
  obj: K8sResourceKind,
} & ModalComponentProps;
type configureLoggingState = {
  enabled: boolean;
  logName: string;
  users: string[];
  ilm: number;
} & PromiseComponentState;
class ConfigureLoggingComponent extends PromiseComponent<configureLoggingProps, configureLoggingState> {
  constructor(props: configureLoggingProps) {
    super(props);

    const {obj} = props;
    const annotations = obj.spec.template.metadata?.annotations || {};
    const enabled = annotations.log_with_fluent === 'yes';
    this.state = {
      errorMessage: '',
      inProgress: false,
      enabled: enabled,
      logName: enabled ? (annotations.log_name || '') : '',
      ilm: enabled ? Number.parseInt(annotations.ILM || '0') : 0,
      users: enabled
        ? Object.keys(annotations)
            .filter((k) => /user_\d+/.test(k))
            .map((k) => annotations[k])
        : [],
    };
  }

  validateItems(): string {
    const {enabled, logName, ilm, users} = this.state;
    if (enabled) {
      if (_.isEmpty(logName)) {
        return 'LogName is required';
      }
      if (ilm < 0 || ilm > MAX_ILM) {
        return 'Invalid ILM';
      }
      if (users.length === 0) {
        return 'At least add one user'
      }
      if (users.findIndex((usr) => _.isEmpty(usr) || !(/^[^\.]+\.[^\.]+$/.test(usr))) !== -1) {
        return "User must be in format 'name.name'";
      }
    }
    return null;
  }
  async updateObject(): Promise<K8sResourceKind> {
    const err = this.validateItems();
    if (err !== null) {
      throw new Error(err);
    }

    const {enabled, logName, users, ilm} = this.state;
    const updatedObj = {...this.props.obj};
    if (!updatedObj.spec.template.metadata) {
      updatedObj.spec.template.metadata = {};
    }
    if (!updatedObj.spec.template.metadata.annotations) {
      updatedObj.spec.template.metadata.annotations = {};
    } else {
      updatedObj.spec.template.metadata.annotations = {...updatedObj.spec.template.metadata.annotations};
    }
    const annotations = updatedObj.spec.template.metadata.annotations;
    // remove old users
    _.forEach(
      Object.keys(annotations).filter((k) => /user_\d+/.test(k)),
      (k) => delete annotations[k]);
    delete updatedObj.spec.template.metadata['creationTimestamp'];
    if (enabled) {
      annotations['log_with_fluent'] = 'yes';
      annotations['log_name'] = logName;
      annotations['ILM'] = ilm.toString();
      _.forEach(
        users,
        (usr, index) => {
          annotations[`user_${index+1}`] = usr;
        }
      )
    } else {
      delete annotations['log_with_fluent'];
      delete annotations['log_name'];
      delete annotations['ILM'];
    }

    return updatedObj;
  }
  submit(e: React.SyntheticEvent<EventTarget>) {
    e.preventDefault();

    this.handlePromise(
      this.updateObject().then((obj) => k8sUpdate(this.props.kind, obj))
    ).then(() => {
      const {close} = this.props;
      close();
    });
  }
  render() {
    const {enabled, logName, ilm, users, errorMessage, inProgress} = this.state;
    const {cancel} = this.props;
    return <form onSubmit={this.submit.bind(this)} name="form" className="modal-content">
      <ModalTitle>Configure Logging</ModalTitle>
      <ModalBody>
        <div className="form-group">
          <label className="checkbox-label pf-c-check__label">
            <input
              type="checkbox"
              id="enabled"
              name="enabled"
              checked={enabled}
              className="pf-c-check__input"
              onChange={({target:{checked}}) => this.setState({enabled: checked})}
            />
            &nbsp;&nbsp;Enable gatherin logs from this {this.props.kind.label}'s pods
          </label>
          <div className="help-block">
            You may gather logs from your pods and collect them in ELK, easier than you think
          </div>
        </div>
        {enabled && (
          <>
            <div className="from-group">
              <label className="control-label co-required" htmlFor="logName">Log Name</label>
              <div className="modal-body__field">
                <input
                  id="logName"
                  name="logName"
                  type="text"
                  value={logName}
                  className="pf-c-form-control"
                  placeholder="ic-openshift-namespace-logname-%dateTime%"
                  onChange={({target: {value}}) => this.setState({logName: value})}
                />
              </div>
              <div className="help-block">
                Name of the log index in Elastic search
              </div>
            </div>
            <div className="form-group">
              <label className="control-label" htmlFor="ilm">ILM</label>
              <div className="modal-body__field">
                <NumberSpinner
                  value={ilm}
                  min={0}
                  max={MAX_ILM}
                  changeValueBy={(operation: number) => this.setState({ilm: ilm + operation})}
                />
              </div>
              <div className="help-block">
                Number of days that logs must remain in the ELK stack
              </div>
            </div>
            <div className="form-group">
              <label className="control-label" htmlFor="users">Users</label>
              <div className="modal-body__field">
                {users.map((usr, idx) => (
                  <Flex
                    key={idx.toString()}
                    style={{ marginBottom: 'var(--pf-global--spacer--sm)' }}>
                    <FlexItem grow={{ default: 'grow' }}>
                      <input
                        name={`user_${idx}`}
                        placeholder="user.name"
                        value={usr}
                        className="pf-c-form-control"
                        onChange={({target: {value}}) => this.setState(({users}) => {
                          const updatedUsers = [...users];
                          updatedUsers[idx] = value;
                          return {users: updatedUsers};
                        })}
                      />
                    </FlexItem>
                    <FlexItem>
                      <Tooltip content="Remove">
                        <Button
                          aria-label='Remove'
                          variant={ButtonVariant.plain}
                          type={ButtonType.button}
                          isInline
                          onClick={() => this.setState(({users}) => {
                            const removedUsers = [...users];
                            removedUsers.splice(idx, 1);
                            return {users: removedUsers};
                          })}>
                          <MinusCircleIcon />
                        </Button>
                      </Tooltip>
                    </FlexItem>
                  </Flex>
                ))}
                <Button
                  variant={ButtonVariant.link}
                  icon={<PlusCircleIcon />}
                  isInline
                  onClick={() => this.setState(({users}) => ({users: [...users, '']}))}>
                  Add User
                </Button>
              </div>
            </div>
          </>
        )}
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText="Update"
        cancel={cancel}
      />
    </form>
  }
};
const configureLoggingComponent = createModalLauncher(ConfigureLoggingComponent);

export const LogConfigAction: KebabAction = (kind: K8sKind, obj: K8sResourceKind) => ({
  label: 'Configure Logging',
  callback: () => {
    configureLoggingComponent({
      kind,
      obj,
    })
  },
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
    verb: 'update',
  },
});
