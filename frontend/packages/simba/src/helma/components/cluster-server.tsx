import * as _ from 'lodash'
import * as React from 'react'
import * as cx from 'classnames';
//import { sortable } from '@patternfly/react-table';
import { Alert } from '@patternfly/react-core';

import {
  k8sList,
  K8sResourceKind,
  // k8sCreate,
} from '@console/internal/module/k8s';
import { ServiceModel } from '@console/internal/models';
import {
  Kebab,
  Dropdown,
  ResourceName,
} from '@console/internal/components/utils'
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  Table,
  TableRow,
  TableData,
  RowFunction
} from '@console/internal/components/factory';

import {
  availableZones,
  enabledZonesMapById,
} from '../../k8s'
import {
  PromiseComponent,
  PromiseComponentState,
  ModalComponentProps,
  createModalLauncher,
} from '../../components'
import {
  HelmaClusterServer
} from '../models'

//import { serializeCyclicObject } from '../../utils'

/* eslint-disable no-underscore-dangle */

const SERVER_CREATION_TYPES = {
  byAddress: 'By Address',
  byService: 'By Service'
};

type clusterServerProps = {
  namespace: string;
  obj?: HelmaClusterServer;
  action?: (obj: HelmaClusterServer) => void;
} & ModalComponentProps;
type clusterServerState = {
  byAddress: boolean;
  address?: string;
  zone?: string;
  serviceName?: string;
  servicePort?: string;
  port?: number;
  weight?: number;
  services?: K8sResourceKind[];
  portOptions: any;
} & PromiseComponentState;
export class ClusterServerEditorComponent extends PromiseComponent<clusterServerProps, clusterServerState> {
  constructor(props: clusterServerProps) {
    super(props);

    const {obj} = this.props;
    this.state = Object.assign({},
      obj
        ? { byAddress: !_.isEmpty(obj.address), ...obj }
        : { byAddress: true, address: null, port: null, weight: 100, },
      { inProgress: false, errorMessage: '', portOptions: null, services: null, });
    /* eslint-disable no-console */
    console.info(`DBG.ClusterServerEditorComponent() => {serviceName: ${this.state.serviceName}, ${this.state.servicePort}}`)
  }

  componentDidMount() {
    // List services to be used in service selection
    k8sList(ServiceModel, {ns: this.props.namespace})
      .then((services) => {
        this.setState({services});
        if (!_.isEmpty(this.state.serviceName)) {
          this._changeService(this.state.serviceName);
        }
      })
      .catch((err) => {
        this.setState({errorMessage: err.message});
      });
  }

  _validateInput() {
    const { byAddress, weight, address, zone, serviceName, servicePort } = this.state;
    if (weight === null || weight < 0) {
      return new Error('Please specify a valid weight for this server');
    }
    if (byAddress) {
      if (_.isEmpty(address)) {
        return new Error('Please specify an address');
      }
    } else {
      if (_.isEmpty(zone)) {
        return new Error('Zone is required')
      }
      if (_.isEmpty(serviceName)) {
        return new Error('Service name is required');
      }
      if (_.isEmpty(servicePort)) {
        return new Error('Service port is required');
      }
    }
    return null;
  }
  _createServer() : HelmaClusterServer {
    const { byAddress, zone, serviceName, servicePort, address, port, weight } = this.state;
    if (byAddress) {
      return {address, port, weight};
    } else {
      return {zone, serviceName, servicePort, port: 443, weight};
    }
  }
  _changeService(serviceName: string) {
    const service = _.find(this.state.services, { metadata: { name: serviceName } });
    const ports = _.get(service, 'spec.ports', []);
    const portOptions = ports.reduce(
      (acc: any, {port, targetPort, protocol}) => {
        acc[port] = (<>{port} &rarr; {targetPort} ({protocol})</>)
        return acc;
      },
      {}
    );
    /* eslint-disable no-console */
    console.info(`DBG.ClusterServerEditorComponent._changeService(${serviceName})`);
    const servicePort = (serviceName === this.state.serviceName && !_.isEmpty(this.state.servicePort))
      ? this.state.servicePort
      : Object.keys(portOptions).length === 1
        ? Object.keys(portOptions)[0]
        : '';
    this.setState({
      serviceName,
      portOptions,
      servicePort,
    });
  }
  _submit(event: React.FormEvent<EventTarget>) {
    event.preventDefault();

    const { close, action } = this.props;
    const err = this._validateInput();
    const promise = err === null
      ? Promise.resolve<HelmaClusterServer>(this._createServer())
      : Promise.reject<HelmaClusterServer>(err);
    this.handlePromise(promise).then(
      (obj) => {
        action && action(obj);
        close(obj);
      }
    );
  }

  render() {
    const title = this.props.obj ? 'Edit' : 'Add';
    const {
      byAddress,
      zone,
      serviceName,
      servicePort,
      services,
      portOptions,
      address,
      port,
      weight
    } = this.state;
    const serviceOptions = _.sortBy(services || [], 'metadata.name')
      .reduce(
        (acc, {metadata: {name}}) => {
          acc[name] = <ResourceName kind="Service" name={name} />;
          return acc;
        },
        {}
      );

    return (
      <form
        name="form"
        className="modal-content modal-content--no-inner-scroll"
        onSubmit={this._submit.bind(this)}
        >
        <ModalTitle>{title} Server</ModalTitle>
        <ModalBody>
          <div className="form-group">
            <label htmlFor="dropdown-type" className="control-label">Type</label>
            <div className="modal-body__field">
              <Dropdown
                id="dropdown-type"
                items={SERVER_CREATION_TYPES}
                selectedKey={byAddress ? 'byAddress' : 'byService'}
                onChange={(t: string) => this.setState({byAddress: t === 'byAddress'})}
                dropDownClassName="dropdown--full-width"
                describedBy="type-help"
              />
            </div>
            <div className="help-block" id="type-help">
              Type of the server
            </div>
          </div>
          {byAddress && (
            <>
              <div className="form-group">
                <label htmlFor="input-address" className="co-required control-label">Address</label>
                <div className="modal-body__field">
                  <input
                    id="input-address"
                    data-test="input-address"
                    name="address"
                    type="text"
                    className="pf-c-form-control"
                    value={address}
                    onChange={(e)=> this.setState({address: e.target.value})}
                    aria-describedBy="address-help"
                    autoFocus
                  />
                </div>
                <div className="help-block" id="address-help">
                  Address of the server
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="input-port" className="control-label">Port</label>
                <div className="modal-body__field">
                  <input
                    id="input-port"
                    name="port"
                    type="text"
                    pattern="[0-9]*"
                    className="pf-c-form-control"
                    onChange={(e) => this.setState({port: e.target.value ? +e.target.value : null})}
                    value={port}
                  />
                </div>
              </div>
            </>
          )}
          {!byAddress && (
            <>
              <div className="form-group">
                <label htmlFor="dropdown-zone" className="co-required control-label">
                  Zone
                </label>
                <div className="modal-body__field">
                  <Dropdown
                    id="dropdown-zone"
                    items={enabledZonesMapById}
                    selectedKey={zone}
                    onChange={(t) => this.setState({zone: t})}
                    dropDownClassName="dropdown--full-width"
                  />
                </div>
              </div>
              {services !== null && !_.isEmpty(services) &&
                <>
                  <div className="form-group">
                    <label htmlFor="dropdown-services" className="co-required control-label">
                      Service
                    </label>
                    <div className="modal-body__field">
                      <Dropdown
                        id="dropdown-services"
                        items={serviceOptions}
                        title={_.isEmpty(serviceName) ? 'Select a service' : serviceOptions[serviceName]}
                        onChange={(s: string) => this._changeService(s)}
                        dropDownClassName="dropdown--full-width"
                      />
                    </div>
                    <div className="help-block" id="">
                      Service that should exposed behind the CDN
                    </div>
                  </div>
                  <div className="from-group">
                    <label htmlFor="dropdown-service-port" className="co-required control-label">
                      Service Port
                    </label>
                    {_.isEmpty(portOptions) && (<p>Select a service above</p>)}
                    {!_.isEmpty(portOptions) && (
                      <>
                        <div className="modal-body__field">
                          <Dropdown
                            id="dropdown-service-port"
                            items={portOptions}
                            title={portOptions[servicePort] || 'Select target port'}
                            dropDownClassName="dropdown--full-width"
                            onChange={(p: string) => {this.setState({servicePort: p})}}
                            describedBy="port-help"
                          />
                        </div>
                        <div className="help-block" id="port-help">
                          Target port for traffic
                        </div>
                      </>
                    )}
                  </div>
                </>
              }
              {services !== null && _.isEmpty(services) &&
                <div className="form-group">
                  <Alert
                    isInline
                    className="co-alert co-create-route__alert"
                    variant="info"
                    title="No services">
                    There are no services in your project to expose behind a CDN.
                  </Alert>
                </div>
              }
            </>
          )}
          <div className="form-group">
            <label htmlFor="input-weight" className="control-label co-required">Weight</label>
            <div className="modal-body__field">
              <input
                id="input-weight"
                name="weight"
                type="text"
                pattern="[0-9]*"
                className="pf-c-form-control"
                onChange={(e) => this.setState({weight: e.target.value ? +e.target.value : null})}
                value={weight || ''}
              />
            </div>
          </div>
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={this.state.errorMessage}
          inProgress={this.state.inProgress}
          submitText={this.props.obj ? 'Update' : 'Create'}
          submitDisabled={this._validateInput() !== null}
          cancel={this.props.cancel.bind(this)}
        />
      </form>
    )
  }
};

const serverLocation = (server: HelmaClusterServer): string => {
  if (!_.isEmpty(server.serviceName)) {
    return server.serviceName + ':' + server.servicePort;
  } else {
    return server.address;
  }
};

const serverColumnClasses = [
  '', // zone
  '', // location
  '', // port
  cx('pf-m-hidden', 'pf-m-visible-on-xl'),
];
const serverListHeaders = () => {
  return [
    {
      title: 'Zone',
      sortField: 'zone',
      transforms: [],
      props: { className: serverColumnClasses[0] },
    },
    {
      title: 'Location',
      sortFunc: 'serverLocation',
      transforms: [],
      props: { className: serverColumnClasses[1] },
    },
    {
      title: 'Port',
      sortField: 'port',
      transforms: [],
      props: { className: serverColumnClasses[4] },
    },
    {
      title: 'Weight',
      sortField: 'weight',
      transforms: [],
      props: { className: serverColumnClasses[5] },
    },
    {
      title: '',  // Kebab header
      props: { className: Kebab.columnClass },
    },
  ];
};

export const clusterServerEditor = createModalLauncher(ClusterServerEditorComponent);

export type ClusterServersListProps = {
  namespace: string;
  editAction: (srv: HelmaClusterServer, index: number) => void;
  deleteAction: (index: number) => void;
  servers: HelmaClusterServer[];
};
export const ClusterServersList: React.FC<ClusterServersListProps> =
  ({namespace, editAction, deleteAction, servers}) => {
    /* eslint-disable no-console */
    const row: RowFunction<HelmaClusterServer> = ({obj, index, key, style}) => {
      const { zone, port, weight } = obj;
      const location = serverLocation(obj);
      const menuActions = [
        {
          label: 'Edit Server',
          callback: () => {
            clusterServerEditor({
              namespace: namespace,
              obj: servers[index],
              action: (obj: HelmaClusterServer) => editAction(obj, index)
            })
          },
        },
        {
          label: 'Delete Server',
          callback: () => deleteAction(index),
        }
      ];
      return <TableRow id={`srv-${index}`} index={index} trKey={key} style={style}>
        <TableData className={serverColumnClasses[0]}>
          <span>{_.isEmpty(zone) ? '' : availableZones.find((z) => z.name === zone).displayName}</span>
        </TableData>
        <TableData className={serverColumnClasses[1]}>
          <span>{location}</span>
        </TableData>
        <TableData className={serverColumnClasses[2]}>
          <span>{port}</span>
        </TableData>
        <TableData className={serverColumnClasses[3]}>
          <span>{weight}</span>
        </TableData>
        <TableData className={Kebab.columnClass}>
          <Kebab options={menuActions} />
        </TableData>
      </TableRow>
    };

    return <Table
      data={servers}
      Header={serverListHeaders}
      aria-label="Servers"
      defaultSortField="serverLocation"
      Row={row}
      loaded={true}
      customSorts={{'serverLocation': serverLocation}}
      virtualize
    />;
  };
