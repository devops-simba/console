import * as _ from 'lodash-es';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Alert, ActionGroup, Button } from '@patternfly/react-core';
import { PlusCircleIcon, MinusCircleIcon } from '@patternfly/react-icons';
import { ButtonBar, Dropdown, history, ResourceName, resourcePathFromModel } from '../utils';
import { k8sCreate, k8sList, K8sResourceKind, K8sKind } from '../../module/k8s';
import { getActiveNamespace } from '../../actions/ui';
import {
  DeploymentModel,
  DeploymentConfigModel,
  StatefulSetModel,
  ReplicationControllerModel,
  ReplicaSetModel,
  DaemonSetModel,
  ServiceModel,
} from '../../models';

const MAX_PORT_COUNT = -1;
const sourceModels = [
  DeploymentModel,
  DeploymentConfigModel,
  StatefulSetModel,
  ReplicationControllerModel,
  ReplicaSetModel,
  DaemonSetModel,
];

export class CreateService extends React.Component<{}, CreateServiceState> {
  state = {
    name: '',
    namespace: getActiveNamespace(),
    selectedModelIndex: -1,
    selectedComponentIndex: 0,
    loadedResources: sourceModels.map(() => null) as K8sResourceKind[][],
    type: 'ClusterIP' as ExposeServiceType,
    externalName: '',
    headlessService: false,
    sessionAffinity: 'None' as ExposeServiceAffinityType,
    ports: [
      {
        protocol: 'TCP',
        key: _.uniqueId('service-port-'),
      },
    ] as ServicePort[],
    inProgress: false,
    error: '',
  };

  getSource(
    loadedResources: (K8sResourceKind[] | string | null)[],
    selectedModelIndex: number,
    selectedComponentIndex: number,
  ): K8sResourceKind | null {
    if (selectedModelIndex < 0) {
      return null;
    }
    const components = loadedResources[selectedModelIndex];
    if (
      components === null ||
      typeof components === 'string' ||
      selectedComponentIndex >= components.length
    ) {
      return null;
    }
    return components[selectedComponentIndex];
  }
  handleChange: React.ReactEventHandler<HTMLInputElement> = (event) => {
    const target = event.currentTarget;
    const name = target.name;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    this.setState({
      [name]: value,
    } as any);
  };
  changeServiceType = (value: ExposeServiceType) => {
    this.setState({
      type: value,
    });
  };
  changeSessionAffinity = (value: ExposeServiceAffinityType) => {
    this.setState({
      sessionAffinity: value,
    });
  };
  addPort = () => {
    this.setState(({ ports }) => {
      const updatedPorts = [...ports];
      updatedPorts.push({ protocol: 'TCP', key: _.uniqueId('service-port-') });
      return {
        ports: updatedPorts,
      };
    });
  };
  removePort = (index: number) => {
    this.setState(({ ports }) => {
      const updatedPorts = [...ports];
      updatedPorts.splice(index, 1);
      return {
        ports: updatedPorts,
      };
    });
  };
  changePort = (index: number, name: string, value: any) => {
    this.setState(({ ports }) => {
      const updatedPorts = [...ports];
      const updatedPort: ServicePort = {
        key: updatedPorts[index].key,
        protocol: updatedPorts[index].protocol,
        port: updatedPorts[index].port,
        targetPort: updatedPorts[index].targetPort,
        targetPortAssignedByUser: updatedPorts[index].targetPortAssignedByUser,
      };
      updatedPort[name] = value;
      if (name === 'targetPort') {
        updatedPort.targetPortAssignedByUser = true;
      } else if (name === 'port' && !updatedPort.targetPortAssignedByUser) {
        updatedPort.targetPort = value;
      }
      updatedPorts[index] = updatedPort;
      return {
        ports: updatedPorts,
      };
    });
  };

  componentDidMount() {
    _.forEach(sourceModels, (model, i) => {
      k8sList(model, { ns: this.state.namespace })
        .then((items) => {
          this.setState(({ loadedResources, selectedModelIndex }) => {
            const updatedResources = [...loadedResources];
            updatedResources[i] = items;
            if (selectedModelIndex < 0 && items.length) {
              selectedModelIndex = i;
            }
            return { selectedModelIndex, loadedResources: updatedResources };
          });
        })
        .catch((err) => {
          this.setState(({ loadedResources }) => {
            const updatedResources = [...loadedResources];
            updatedResources[i] = err.message;
            return { loadedResources: updatedResources };
          });
        });
    });
  }

  render() {
    const title = 'Create Service';
    const serviceTypeOptions = {
      ClusterIP: 'ClusterIP',
      LoadBalancer: 'LoadBalancer',
      ExternalName: 'ExternalName',
    };
    const sessionAffinityOptions = {
      None: 'None',
      Client: 'Client',
    };
    const {
      name,
      namespace,
      selectedModelIndex,
      selectedComponentIndex,
      loadedResources,
      type,
      externalName,
      headlessService,
      sessionAffinity,
      ports,
    } = this.state;

    const portOptions = _.map(ports, (port, index) => {
      return (
        <PortGroup
          key={port.key}
          index={index}
          port={port}
          canRemove={ports.length > 1}
          onChange={this.changePort}
          onRemove={this.removePort}
        />
      );
    });

    return (
      <>
        <div className="co-m-pane__body co-m-pane__form">
          <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
            <div className="co-m-pane__name">{title}</div>
            <div className="co-m-pane__heading-link">
              <Link
                to={`/k8s/ns/${namespace}/services/~new`}
                id="yaml-link"
                data-test="yaml-link"
                replace
              >
                Edit YAML
              </Link>
            </div>
          </h1>
          <p className="co-m-pane__explanation">
            A Kubernetes Service is an abstraction layer which defines a logical set of Pods and
            enables external traffic exposure, load balancing and service discovery for those Pods.
          </p>
          <form onSubmit={this.save} className="co-create-service">
            <div className="form-group co-create-service__name">
              <label className="co-required" htmlFor="name">
                Name
              </label>
              <input
                className="pf-c-form-control"
                type="text"
                onChange={this.handleChange}
                value={name}
                placeholder="my-service"
                id="name"
                name="name"
                aria-describedby="name-help"
                required
              />
              <div className="help-block" id="name-help">
                <p>A unique name for the service within the project.</p>
              </div>
            </div>
            <SourceSelector
              models={sourceModels}
              selectedModelIndex={selectedModelIndex}
              components={loadedResources[selectedModelIndex]}
              selectedComponentIndex={selectedComponentIndex}
              onTypeChange={(i: number) => {
                this.setState({
                  selectedModelIndex: i,
                  selectedComponentIndex: 0,
                });
              }}
              onChange={(i: number) => {
                this.setState({
                  selectedComponentIndex: i,
                });
              }}
            />
            <div className="form-group co-create-service__type">
              <label htmlFor="type">Type</label>
              <Dropdown
                id="type"
                name="type"
                items={serviceTypeOptions}
                selectedKey={type}
                dropDownClassName="dropdown--full-width"
                onChange={this.changeServiceType}
                required
              />
              <div className="help-block" id="service-help">
                Type of the service
              </div>
            </div>
            {type === 'ExternalName' && (
              <div className="form-group co-create-service__external_name">
                <label htmlFor="externalName" className="co-required">
                  External Name
                </label>
                <div className="">
                  <input
                    type="text"
                    id="externalName"
                    name="externalName"
                    className="pf-c-form-control"
                    value={externalName}
                    onChange={this.handleChange}
                  />
                </div>
                <div className="help-block" id="externalName-help">
                  Domain for external name
                </div>
              </div>
            )}
            <div className="form-group co-create-service__headless_service">
              <label>
                <input
                  type="checkbox"
                  id="headlessService"
                  name="headlessService"
                  title="headlessService"
                  checked={headlessService}
                  onChange={this.handleChange}
                />
                <span>Headless service</span>
              </label>
              <div className="help-block">
                <p>
                  Sometimes you don't need load-balancing and a single Service IP. In this case, you
                  can create what are termed "headless" Services
                </p>
              </div>
            </div>
            <div className="from-group co-create-service__session_affinity">
              <label htmlFor="sessionAffinity">Session Affinity</label>
              <Dropdown
                id="sessionAffinity"
                name="sessionAffinity"
                items={sessionAffinityOptions}
                selectedKey={sessionAffinity}
                dropDownClassName="dropdown--full-width"
                onChange={this.changeSessionAffinity}
              />
              <div className="help-block" id="sessionAffinity-help">
                <p>
                  If you want to make sure that connections from a particular client are passed to
                  the same Pod each time, you can select the session affinity based on the client's
                  IP addresses
                </p>
              </div>
            </div>
            {portOptions}
            {(MAX_PORT_COUNT <= 0 || MAX_PORT_COUNT > ports.length) && (
              <Button
                className="pf-m-link--align-left co-create-service__add-port-btn"
                onClick={this.addPort}
                type="button"
                variant="link"
                isInline
              >
                <PlusCircleIcon className="co-icon-space-r" />
                Add another port
              </Button>
            )}
            <ButtonBar errorMessage={this.state.error} inProgress={this.state.inProgress}>
              <ActionGroup className="pf-c-form">
                <Button
                  type="submit"
                  isDisabled={
                    !this.state.name ||
                    !this.getSource(loadedResources, selectedModelIndex, selectedComponentIndex)
                  }
                  id="save-changes"
                  variant="primary"
                >
                  Create
                </Button>
                <Button onClick={history.goBack} id="cancel" variant="secondary">
                  Cancel
                </Button>
              </ActionGroup>
            </ButtonBar>
          </form>
        </div>
      </>
    );
  }

  save = (event) => {
    event.preventDefault();

    const {
      name,
      namespace,
      type,
      externalName,
      headlessService,
      selectedModelIndex,
      selectedComponentIndex,
      ports,
      loadedResources,
    } = this.state;

    const sourceObject = this.getSource(
      loadedResources,
      selectedModelIndex,
      selectedComponentIndex,
    );
    if (sourceObject === null) {
      this.setState({
        error: 'Please select a source item',
      });
      return;
    }

    const srcSelector = sourceObject.spec.selector;
    if ('matchExpressions' in srcSelector) {
      this.setState({
        error: 'MatchExpressions is not supported as selector in the service',
      });
      return;
    }

    let selector = null;
    if ('matchLabels' in srcSelector) {
      selector = srcSelector.matchLabels;
    } else {
      selector = srcSelector;
    }
    const service: K8sResourceKind = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: { name, namespace },
      spec: {
        type,
        selector,
        ports: _.map(ports, (p) => {
          const result: ServicePortNoKey = {
            protocol: p.protocol,
          };
          if (p.name) {
            result.name = p.name;
          }
          if (p.port) {
            result.port = p.port;
          }
          if (p.targetPort) {
            result.targetPort = p.targetPort;
          }
          return result;
        }),
      },
    };
    if (type === 'ExternalName') {
      service.spec.externalName = externalName;
    }
    if (type === 'LoadBalancer') {
      service.spec.externalTrafficPolicy = 'Local';
    }
    if (headlessService) {
      service.spec.clusterIP = 'None';
    }

    this.setState({ inProgress: true });
    k8sCreate(ServiceModel, service).then(
      () => {
        this.setState({ inProgress: false });
        history.push(resourcePathFromModel(ServiceModel, name, namespace));
      },
      (err) => {
        this.setState({
          inProgress: false,
          error: err.message,
        });
      },
    );
  };
}

export const PortGroup: React.FC<PortGroupProps> = (props) => {
  const { index, onChange, onRemove, port, canRemove } = props;

  const protocolOptions = {
    TCP: 'TCP',
    UDP: 'UDP',
    SCTP: 'SCTP',
  };

  return (
    <div className={`co-create-service-port-group co-create-service-port_group_${index & 1}`}>
      <div className="form-group">
        <label htmlFor={`port-${index}-name`}>Name</label>
        <input
          type="text"
          id={`port-${index}-name`}
          name={`port-${index}-name`}
          value={port.name}
          className="pf-c-form-control"
          aria-describedby={`port-${index}-name-help`}
          onChange={(e) => onChange(index, 'name', e.currentTarget.value)}
        />
        <div className="help-block" id={`port-${index}-name-help`}>
          <p>Optional name of this port</p>
        </div>
      </div>
      <div className="form-group">
        <label htmlFor={`port-${index}-protocol`} className="co-required">
          Protocol
        </label>
        <Dropdown
          id={`port-${index}-protocol`}
          name={`port-${index}-protocol`}
          items={protocolOptions}
          selectedKey={port.protocol}
          title="Select protocol of the port"
          dropDownClassName="dropdown--full-width"
          onChange={(value: any) => onChange(index, 'protocol', value)}
        />
        <div className="help-block">
          <p>Protocol that must used with this port</p>
        </div>
      </div>
      <div className="form-group co-create-service__block_label">
        <label htmlFor={`port-${index}-port`}>Port</label>
        <input
          type="number"
          id={`port-${index}-port`}
          name={`port-${index}-port`}
          value={port.port}
          className="pf-c-form-control"
          aria-describedby={`port-${index}-port-help`}
          onChange={(e) => onChange(index, 'port', e.currentTarget.valueAsNumber)}
        />
        <div className="help-block" id={`port-${index}-port-help`}>
          <p>External port number for the service. Please input a value between 0 and 65535</p>
        </div>
      </div>
      <div className="form-group co-create-service__block_label">
        <label className="co-required" htmlFor={`port-${index}-target-port`}>
          Target Port
        </label>
        <input
          type="number"
          id={`port-${index}-target-port`}
          name={`port-${index}-target-port`}
          value={port.targetPort}
          className="pf-c-form-control"
          aria-describedby={`port-${index}-target-port-help`}
          onChange={(e) => onChange(index, 'targetPort', e.currentTarget.valueAsNumber)}
        />
        <div className="help-block" id={`port-${index}-target-port-help`}>
          <p>Internal port number for the service. Please input a value between 0 and 65535</p>
        </div>
        {canRemove && (
          <div className="co-add-remove-form__link--remove-entry">
            <Button type="button" onClick={() => onRemove(index)}>
              <MinusCircleIcon className="co-icon-space-r" />
              Remove port
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
export const SourceSelector: React.FC<SourceSelectorProps> = (props) => {
  const {
    models,
    selectedComponentIndex,
    selectedModelIndex,
    components,
    onTypeChange,
    onChange,
  } = props;

  const getModelKey = (index: number): string =>
    index < 0 || index >= models.length ? null : models[index].id;
  const getModelIndexFromKey = (key: string): number => _.findIndex(models, (m) => m.id === key);

  const getComponentKey = (index: number): string =>
    index < 0 || index >= components.length ? null : components[index].metadata.name;
  const getComponentIndexFromKey = (key: string): number =>
    _.findIndex(components, (c) => c.metadata.name === key);

  const sourceTypeOptions = {};
  _.forEach(models, (model, i) => {
    const key = getModelKey(i);
    sourceTypeOptions[key] = <ResourceName kind={model.kind} name={model.label} />;
  });
  const modelTitle =
    selectedModelIndex < 0 || selectedModelIndex >= models.length
      ? undefined
      : sourceTypeOptions[getModelKey(selectedModelIndex)];

  const sourceOptions = {};
  if (components !== null) {
    _.forEach(components, (component, i) => {
      const key = getComponentKey(i);
      sourceOptions[key] = <ResourceName kind={component.kind} name={component.metadata.name} />;
    });
  }
  const sourceTitle =
    components !== null &&
    typeof components !== 'string' &&
    !_.isEmpty(components) &&
    selectedComponentIndex >= 0 &&
    selectedComponentIndex < components.length
      ? sourceOptions[getComponentKey(selectedComponentIndex)]
      : undefined;

  return (
    <>
      <div className="form-group co-create-service__source_type">
        <label htmlFor="source_type">Type of the source</label>
        <Dropdown
          id="source_type"
          name="source_type"
          items={sourceTypeOptions}
          selectedKey={getModelKey(selectedModelIndex)}
          onChange={(key: string) => onTypeChange(getModelIndexFromKey(key))}
          dropDownClassName="dropdown--full-width"
          title={modelTitle}
          required
        />
        <div className="help-block">
          <p>Where we should look for the source of the service</p>
        </div>
      </div>
      <div className="form-group co-create-service__source">
        <label htmlFor="source">Source of the service</label>
        {selectedModelIndex < 0 && (
          <Alert
            isInline
            className="co-alert co-create-service__no_type"
            variant="info"
            title="No type is selected"
          >
            Please select type of the source
          </Alert>
        )}
        {selectedModelIndex >= 0 && components === null && (
          <Alert
            isInline
            className="co-alert co-create-service__loading"
            variant="info"
            title="Loading data"
          >
            Still loading data from the server
          </Alert>
        )}
        {selectedModelIndex >= 0 && components !== null && typeof components === 'string' && (
          <Alert
            isInline
            className="co-alert co-create-service__error"
            variant="warning"
            title="Error in loading items"
          >
            <span>
              Error in loading <b>{models[selectedModelIndex].label}</b> from the server
            </span>
          </Alert>
        )}
        {selectedModelIndex >= 0 &&
          components !== null &&
          typeof components !== 'string' &&
          _.isEmpty(components) && (
            <Alert
              isInline
              className="co-alert co-create-service__alert"
              variant="info"
              title="No items"
            >
              {`There is no <b>${models[selectedModelIndex].label}</b> in your project`}
            </Alert>
          )}
        {selectedModelIndex >= 0 &&
          components !== null &&
          typeof components !== 'string' &&
          !_.isEmpty(components) && (
            <>
              <Dropdown
                id="source"
                name="source"
                items={sourceOptions}
                selectedKey={getComponentKey(selectedComponentIndex)}
                onChange={(key: string) => onChange(getComponentIndexFromKey(key))}
                dropDownClassName="dropdown--full-width"
                title={sourceTitle}
              />
              <div className="help-block">
                <p>Select the object that is source of the service</p>
              </div>
            </>
          )}
      </div>
    </>
  );
};

export type PortGroupProps = {
  port: ServicePort;
  onChange: Function;
  onRemove: Function;
  index: number;
  canRemove: boolean;
};
export type SourceSelectorProps = {
  // list of models tat we must selected from them
  models: K8sKind[];
  // index of selected model
  selectedModelIndex: number;
  // index of selected component or null if there is no selected source
  selectedComponentIndex: number;
  // list of component that user should selected from them
  components: K8sResourceKind[];
  // will be called when type of component changed
  onTypeChange: Function;
  // will be called when selected source change
  onChange: Function;
};

//export type ExposeServiceSourceType = 'Deployment' | 'DeploymentConfig' | 'StatefullSet' | 'ReplicationController' | 'ReplicaSet' | 'DaemonSet';
export type ExposeServiceAffinityType = 'None' | 'Client';
export type ExposeServiceType = 'ClusterIP' | 'LoadBalancer' | 'ExternalName' /* | 'NodePort' */;
export type ServicePortType = 'TCP' | 'UDP' | 'SCTP' /* | 'NodePort' */;
export type ServicePortNoKey = {
  name?: string;
  protocol: ServicePortType;
  port?: number;
  targetPort?: number;
};
export type ServicePort = ServicePortNoKey & {
  key: string;
  targetPortAssignedByUser?: boolean;
};
export type CreateServiceState = {
  name: string;
  namespace: string;
  selectedModelIndex: number;
  selectedComponentIndex: number;
  type: ExposeServiceType;
  externalName: string;
  headlessService: boolean;
  sessionAffinity: ExposeServiceAffinityType;
  ports: ServicePort[];
  loadedResources: (K8sResourceKind[] | string | null)[];
  inProgress: boolean;
  error: string;
};
