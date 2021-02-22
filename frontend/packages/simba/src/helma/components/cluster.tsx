import * as _ from 'lodash'
import * as React from 'react'
import { Button } from '@patternfly/react-core'
//import { sortable } from '@patternfly/react-table';

import {
  Kebab,
  Dropdown,
} from '@console/internal/components/utils'
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,

  Table,
  TableRow,
  TableData,
  RowFunction,
} from '@console/internal/components/factory';
import {
  editCollectionAction,
  deleteFromCollectionAction,
  PromiseComponent,
  PromiseComponentState,
  ModalComponentProps,
  createModalLauncher,
} from '../../components'
import {
  HelmaClusterServer,
  HelmaClusterType,
  HelmaClusterProtocol,
  HelmaCluster,
} from '../models'

import {
  ClusterServersList,
  clusterServerEditor
} from './cluster-server'

//import { serializeCyclicObject } from '../../utils'

/* eslint-disable no-underscore-dangle */
/* eslint-disable promise/catch-or-return */

const CLUSTER_TYPES = {
  ip: 'IP',
  dns: 'DNS',
};
const CLUSTER_PROTOCOLS = {
  default: 'Default',
  auto: 'Auto',
  http: 'HTTP',
  https: 'HTTPS',
};

function fixServer(server: HelmaClusterServer): HelmaClusterServer {
  const result: HelmaClusterServer = {
    weight: server.weight === null ? 100 : server.weight,
  };
  if (server.address !== null) {
    result.address = server.address;
  }
  if (server.zone !== null) {
    result.zone = server.zone;
  }
  if (server.serviceName !== null) {
    result.serviceName = server.serviceName;
  }
  if (server.servicePort !== null) {
    result.servicePort = server.servicePort;
  }
  if (server.port !== null) {
    result.port = server.port;
  }
  return result;
}

export type ClusterEditorProps = {
  namespace: string;
  obj?: HelmaCluster;
  action?: (obj: HelmaCluster) => void;
} & ModalComponentProps;
type clusterEditorState = {
  name: string;
  type?: HelmaClusterType;
  protocol?: HelmaClusterProtocol;
  servers: HelmaClusterServer[];
} & PromiseComponentState;
export class ClusterEditorComponent extends PromiseComponent<ClusterEditorProps, clusterEditorState> {
  constructor(props: ClusterEditorProps) {
    super(props);

    /* eslint-disable no-console */
    const {obj} = this.props;
    this.state = Object.assign({},
      obj
        ? { name: obj.name, type: obj.type, protocol: obj.protocol, servers: [...(obj.servers || [])], }
        : { name: '', type: 'dns' as HelmaClusterType, protocol: 'auto' as HelmaClusterProtocol, servers: [], },
      {inProgress: false, errorMessage: ''});
  }

  _validateInput() {
    const {name, servers} = this.state;
    if (_.isEmpty(name)) {
      return new Error('Please enter a name');
    } else if (_.isEmpty(servers)) {
      return new Error('You must add at least one server');
    } else {
      return null;
    }
  }
  _createCluster(): HelmaCluster {
    const {name, type, protocol, servers} = this.state;
    return { name, type, protocol, servers };
  }
  _submit(event: React.FormEvent<EventTarget>) {
    event.preventDefault();

    const { close, action } = this.props;
    const err = this._validateInput();
    const promise = err === null
      ? Promise.resolve<HelmaCluster>(this._createCluster())
      : Promise.reject<HelmaCluster>(err);

    this.handlePromise(promise).then(
      (obj) => {
        action && action(obj);
        close(obj);
      }
    )
  }

  render() {
    const title = this.props.obj ? 'Edit' : 'Add';
    const {name, type, protocol, servers} = this.state;
    const addNewServer = (_event: any) => {
      this.setState({errorMessage: ''});
      clusterServerEditor({
          namespace: this.props.namespace,
          action: (obj: HelmaClusterServer) => {
            this.setState(({servers}) => ({servers: [...servers, fixServer(obj)]}));
          },
        });
    };
    return (
      <form
        name="form"
        className="modal-content modal-content--no-inner-scroll"
        onSubmit={this._submit.bind(this)}
        >
        <ModalTitle>{title} Cluster</ModalTitle>
        <ModalBody>
          <div className="form-group">
            <label htmlFor="input-name" className="co-required control-label">Name</label>
            <div className="modal-body__field">
              <input
                id="input-name"
                data-test="input-address"
                name="name"
                type="text"
                onChange={(e) => this.setState({
                  name: e.target.value,
                  errorMessage: '' // reset error
                })}
                className="pf-c-form-control"
                value={name}
                autoFocus
                aria-describedby="name-help"
              />
            </div>
            <div className="help-block" id="name-help">
              Name of this cluster
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="dropdown-type" className="control-label">Type</label>
            <div className="modal-body__field">
              <Dropdown
                id="dropdown-type"
                items={CLUSTER_TYPES}
                selectedKey={type}
                onChange={(t: string) => this.setState({
                  type: (t.toLowerCase() as HelmaClusterType),
                  errorMessage: '' // reset possible error
                })}
                dropDownClassName="dropdown--full-width"
              />
            </div>
            <div className="help-block" id="type-help">
              Type of the cluster
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="dropdown-protocol" className="control-label">Protocol</label>
            <div className="modal-body__field">
              <Dropdown
                id="dropdown-protocol"
                items={CLUSTER_PROTOCOLS}
                selectedKey={protocol}
                onChange={(p: string) => this.setState({
                  protocol: p.toLowerCase() as HelmaClusterProtocol,
                  errorMessage: '' // reset error
                })}
                dropDownClassName="dropdown--full-width"
              />
            </div>
          </div>
          <div className="form-group">
            <h2 className="co-m-pane__heading co-m-pane__heading--baseline">
              <div className="co-m-pane__name">Servers</div>
              <div className="co-m-pane__heading-link">
                <Button onClick={addNewServer}>
                  Add a new server
                </Button>
              </div>
            </h2>
            {!_.isEmpty(servers) && (
              <ClusterServersList
                namespace={this.props.namespace}
                editAction={editCollectionAction(this, 'servers', fixServer)}
                deleteAction={deleteFromCollectionAction(this, 'servers', 'Server')}
                servers={servers}
              />
            )}
          </div>
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={this.state.errorMessage}
          inProgress={this.state.inProgress}
          submitText={this.props.obj ? 'Update' : 'Create'}
          submitDisabled={this._validateInput() !== null}
          cancel={this.props.cancel}
        />
      </form>
    )
  }
};

export const clusterEditor = createModalLauncher(ClusterEditorComponent);

const clusterTableColumnClasses = [
  '', // name
  '', // type
  '', // protocol
  '', // servers
];
export const ClusterTableHeaders = () => {
  return [
    {
      title: 'Name',
      sortField: 'name',
      transforms: [],
    },
    {
      title: 'Type',
    },
    {
      title: 'Protocol',
    },
    {
      title: 'Servers',
    },
    {
      title: '',  // Kebab header
      props: { className: Kebab.columnClass },
    },
  ];
};
export type ClusterListProps = {
  namespace: string;
  editAction: (obj: HelmaCluster, index: number) => void;
  deleteAction: (index: number) => void;
  clusters: HelmaCluster[];
};
export const ClusterList: React.FC<ClusterListProps> =
  ({namespace, clusters, editAction, deleteAction}) => {
    const row: RowFunction<HelmaCluster> = ({obj, index, key, style}) => {
      const menuActions = [
        {
          label: `Edit Cluster ${obj.name}`,
          callback: () => {
            clusterEditor({
              obj,
              namespace: namespace,
              action: (obj: HelmaCluster) => editAction(obj, index),
            });
          },
        },
        {
          label: `Delete Cluster ${obj.name}`,
          callback: () => deleteAction(index)
        }
      ];

      const {name, type, protocol, servers} = obj;
      return <TableRow id={`c-${index}`} index={index} trKey={key} style={style}>
        <TableData className={clusterTableColumnClasses[0]}>
          <span>{name}</span>
        </TableData>
        <TableData className={clusterTableColumnClasses[1]}>
          <span>{(type || 'ip').toUpperCase()}</span>
        </TableData>
        <TableData className={clusterTableColumnClasses[2]}>
          <span>{protocol || 'default'}</span>
        </TableData>
        <TableData className={clusterTableColumnClasses[3]}>
          <span>{(servers || []).length}</span>
        </TableData>
        <TableData className={Kebab.columnClass}>
          <Kebab options={menuActions} />
        </TableData>
      </TableRow>
    };
    return <Table
      data={clusters}
      Header={ClusterTableHeaders}
      aria-label="Clusters"
      defaultSortField="name"
      Row={row}
      loaded={true}
      virtualize
    />
  };
