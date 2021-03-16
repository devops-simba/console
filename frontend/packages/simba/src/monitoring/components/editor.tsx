import * as _ from 'lodash';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, ActionGroup } from '@patternfly/react-core';

import {
  k8sList,
  K8sResourceKind,
  Selector,
  k8sCreate,
  k8sUpdate,
  apiVersionForModel,
} from '@console/internal/module/k8s';
import {
  ServiceModel
} from '@console/internal/models';
import {
  getActiveNamespace
} from '@console/internal/actions/ui';
import {
  ButtonBar,
  history,
} from '@console/internal/components/utils';

import { ObjectSelectorEditor } from '../../components';
import {
  // Duration,
  // HTTPScheme,
  ServiceMonitorKind,
  ServiceMonitorModel,
  ServiceMonitorEndpoint,
} from '../models';
import {
  isMatch,
  isEmptySelector,
} from '../../utils';

import {
  EndpointView,
  endpointEditor,
} from './endpoint'

export type PortByName = {
  name: string;
};
export type PortByTarget = {
  targetPort: string;
};
export type PortSelection = PortByTarget | PortByName;

export type ServiceMonitorEditorProps = {
  obj?: ServiceMonitorKind;
};
// type monitoringEndpoint = {
//   interval: Duration;
//   port?: string;
//   targetPort?: string;
//   scheme: HTTPScheme;
// };
type serviceMonitorEditorState = {
  inProgress: boolean;
  errorMessage: string;
  namespace: string;

  services?: K8sResourceKind[];

  name?: string;
  selector?: Selector;
  endpoints?: ServiceMonitorEndpoint[];
};

export class ServiceMonitorEditor extends React.Component<ServiceMonitorEditorProps, serviceMonitorEditorState> {
  constructor(props: ServiceMonitorEditorProps) {
    super(props);

    const {obj} = props;

    this.state = Object.assign({},
      obj
        ? {
            name: obj.metadata.name,
            namespace: obj.metadata.namespace,
            selector: obj.spec.selector,
            endpoints: obj.spec.endpoints.map((ep): ServiceMonitorEndpoint => {
              return {
                interval: ep.interval,
                port: ep.port,
                targetPort: ep.targetPort,
                scheme: ep.scheme,
              };
            }),
          }
        : {
            name: '',
            namespace: getActiveNamespace(),
            selector: {
              matchLabels: {},
              matchExpressions: []
            },
            endpoints: [],
          },
      { inProgress: false, errorMessage: '', services: null, }
    );
  }

  componentDidMount() {
    k8sList(ServiceModel, {ns: this.state.namespace})
      .then((services) => {
        this.setState({services});
      })
      .catch((err) => {
        this.setState({errorMessage: err.message});
      })
  }

  validateInput(): Error {
    const {name, selector, services, endpoints} = this.state;
    const servicesWithLabel = (services||[]).filter((svc) => !_.isEmpty(svc.metadata?.labels));
    const selectedServices = (!isEmptySelector(selector) && !_.isEmpty(servicesWithLabel))
      ? services.filter((svc) => isMatch(svc.metadata, selector))
      : [];
    if (_.isEmpty(name)) {
      return new Error('Please enter a name for service monitor');
    }
    if (selectedServices.length === 0) {
      return new Error('Please select some services');
    }
    if (_.isEmpty(endpoints)) {
      return new Error('Please add at least one endpoint');
    }

    return null;
  }
  submit(e: React.SyntheticEvent<EventTarget>) {
    e.preventDefault();

    const err = this.validateInput();
    if (err !== null) {
      this.setState({errorMessage: err.message})
      return;
    }

    const {obj} = this.props;
    const {name, namespace, selector, endpoints} = this.state;

    this.setState({
      inProgress: true,
      errorMessage: ''
    });
    let serviceMonitor: any;
    let fn: (model: any, value: any) => Promise<any>;
    if (obj) {
      serviceMonitor = {...obj};
      serviceMonitor.metadata = {...obj.metadata};
      serviceMonitor.spec = {...obj.spec};
      serviceMonitor.spec.selector = selector;
      fn = k8sUpdate;
    } else {
      serviceMonitor = {
        apiVersion: apiVersionForModel(ServiceMonitorModel),
        kind: ServiceMonitorModel.kind,
        metadata: {
          name,
          namespace,
        },
        spec: {
          selector,
          endpoints,
        }
      };
      fn = k8sCreate;
    }
    /* eslint-disable no-console */
    serviceMonitor.spec.namespaceSelector = {
      matchNames: [namespace],
    };

    console.info(`DBG.submit() => ${JSON.stringify(serviceMonitor)}`)
    fn(ServiceMonitorModel, serviceMonitor).then(
      () => {
        this.setState({ inProgress: false });
        history.push(`/k8s/ns/${namespace}/monitoring.coreos.com~v1~ServiceMonitor/${name}`);
      },
      (e) => {
        this.setState({
          inProgress: false,
          errorMessage: e.message,
        })
      }
    );
  }

  render() {
    const title = (this.props.obj ? 'Edit' : 'Create') + ' ServiceMonitor';
    const {name, namespace, selector, services, endpoints} = this.state;
    /* eslint-disable no-console */
    const servicesWithLabel = (services||[]).filter((svc) => !_.isEmpty(svc.metadata?.labels));
    const selectedServices = (!isEmptySelector(selector) && !_.isEmpty(servicesWithLabel))
      ? services.filter((svc) => isMatch(svc.metadata, selector))
      : [];

    // select ports that have same target ports on all services
    const ports = [];
    if (selectedServices.length) {
      const firstServicePorts = selectedServices[0].spec.ports || [];
      for (let i = 0; i < firstServicePorts.length; i++) {
        const port = firstServicePorts[i];
        let allHaveThisPort = true;
        for (let j = 1; j < selectedServices.length; j++) {
          const svc = selectedServices[j];
          if (svc.spec.ports.findIndex((p) => p.targetPort == port.targetPort) == -1) {
            allHaveThisPort = false;
            break;
          }
        }
        if (allHaveThisPort) {
          ports.push(port);
        }
      }
    }
    const addEndpoint = () => {
      endpointEditor({
        ports,
        action: (ep) => {
          this.setState(({endpoints}) => ({endpoints: [...endpoints, ep]}));
        }
      })
    };

    return <>
      <div className="co-m-pane__body co-m-pane__form">
        <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
          <div className="co-m-pane__name">{title}</div>
          <div className="co-m-pane__heading-link">
            <Link
              to={`/k8s/ns/${namespace}/servicemonitors/~new`}
              id="yaml-link"
              data-test="yaml-link"
              replace>
              Edit YAML
            </Link>
          </div>
        </h1>
        <p className="co-m-pane__explanation">
          ServiceMonitor is a way to instruct monitoring to gather samples from your services
        </p>
        <form onSubmit={this.submit.bind(this)} className="co-create-servicemonitor">
          <div className="form-group co-create-servicemonitor__name">
            <label className="control-label co-required" htmlFor="name">Name</label>
            <input
              className="pf-c-form-control"
              type="text"
              onChange={(e) => this.setState({name: e.target.value})}
              value={name}
              placeholder="my-servicemonitor"
              id="name"
              name="name"
              aria-describedby="name-help"
              required
            />
            <div className="help-block" id="name-help">
              <p>A unique name for the ServiceMonitor within the project.</p>
            </div>
          </div>
          {services !== null && !_.isEmpty(servicesWithLabel) && (
            <>
              <div className="form-group co-create-servicemonitor__selector">
                <label className="control-label co-required" htmlFor="object-selector">Services</label>
                <ObjectSelectorEditor
                  id="object-selector"
                  selector={selector}
                  model={ServiceMonitorModel}
                  objects={servicesWithLabel}
                  matchedObjectsTitle="Matched Services"
                  hideSelectedObjects
                  onChange={(selector) => this.setState({selector, endpoints: [], errorMessage: ''})}
                />
              </div>
              <div className="form-group co-create-servicemonitor__endpoints">
                {_.isEmpty(selectedServices) && (
                  <p>Please select some service above</p>
                )}
                {!_.isEmpty(selectedServices) && !ports.length && (
                  <p>There is no common port between this services</p>
                )}
                {!_.isEmpty(selectedServices) && (ports.length !== 0) && (
                  <>
                    <h2 className="co-m-pane__heading co-m-pane__heading--baseline">
                      <div className="co-m-pane__endpoints">Endpoints</div>
                      <div className="co-m-pane__heading-link">
                        <Button onClick={addEndpoint} className="add-component-button" isDisabled={selectedServices.length == 0}>
                          Add New Endpoint
                        </Button>
                      </div>
                    </h2>
                    <EndpointView endpoints={endpoints} />
                  </>
                )}
              </div>
            </>
          )}
          {services !== null && _.isEmpty(servicesWithLabel) && (
            <Alert
              isInline
              className="co-alert co-create-servicemonitor__alert"
              variant="warning"
              title="No services">
              {_.isEmpty(services) && "There are no services in your project"}
              {!_.isEmpty(services) && "Services that exists in your project does not have any labels. In order to monitor a service it must have at least one label."}
            </Alert>
          )}
          <ButtonBar errorMessage={this.state.errorMessage} inProgress={this.state.inProgress}>
            <ActionGroup className="pf-c-form">
              <Button
                type="submit"
                isDisabled={this.validateInput() !== null}
                id="save-changes"
                variant="primary"
              >
                {this.props.obj ? 'Update' : 'Create'}
              </Button>
              <Button onClick={history.goBack} id="cancel" variant="secondary">
                Cancel
              </Button>
            </ActionGroup>
          </ButtonBar>
        </form>
      </div>
    </>
  }
};
export const ServiceMonitorCreator: React.FC<{}> = (props) =>
  <ServiceMonitorEditor />
