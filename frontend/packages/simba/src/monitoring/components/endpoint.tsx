import * as _ from 'lodash';
import * as React from 'react';

import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  Table,
  //TableProps,
  TableRow,
  TableData,
  RowFunction,
} from '@console/internal/components/factory';
import {
  Dropdown
} from '@console/internal/components/utils';

import {
  PromiseComponent,
  PromiseComponentState,
  ModalComponentProps,
  createModalLauncher,
} from '../../components'

import {
  HTTPScheme,
  HTTPSchemeList,
  Duration,
  DurationList,
  ServiceMonitorEndpoint,
} from '../models';

const endpointTableClasses = [
  '',
  '',
  '',
  '',
];
const endpointTableHeaders = () => [
  {
    title: 'Scheme',
    props: {className: endpointTableClasses[0]},
  },
  {
    title: 'Path',
    props: {className: endpointTableClasses[1]},
  },
  {
    title: 'Port',
    props: {className: endpointTableClasses[2]},
  },
  {
    title: 'Interval',
    props: {className: endpointTableClasses[3]},
  }
];

const endpointRow: RowFunction<ServiceMonitorEndpoint> =
  ({obj: {scheme, path, port, targetPort, interval}, key, index, style}) => {
    return <TableRow id={`ep-${key}`} index={index} style={style} trKey={key}>
      <TableData className={endpointTableClasses[0]}>
        {scheme}
      </TableData>
      <TableData className={endpointTableClasses[1]}>
        {path}
      </TableData>
      <TableData className={endpointTableClasses[2]}>
        {/*port ? `Port: ${port}` : */`Target Port: ${targetPort}`}
      </TableData>
      <TableData className={endpointTableClasses[3]}>
        {interval}
      </TableData>
    </TableRow>
  };

export const EndpointView: React.FC<{endpoints: ServiceMonitorEndpoint[]}> = ({endpoints}) => {
  return <Table
    data={endpoints}
    Row={endpointRow}
    Header={endpointTableHeaders}
    aria-label='endpoints'
    loaded
  />
};

export type PortInfo = {
  name: string;
  targetPort: string;
};
export type EndpointEditorProps = {
  endpoint?: ServiceMonitorEndpoint;
  ports: PortInfo[];
  action?: (endpoint: ServiceMonitorEndpoint) => void;
} & ModalComponentProps;
type endpointEditorState = {
  scheme: HTTPScheme;
  path: string;
  interval: Duration;
  portIndex: number;
} & PromiseComponentState;
export class EndpointEditor extends PromiseComponent<EndpointEditorProps, endpointEditorState> {
  constructor(props: EndpointEditorProps) {
    super(props);

    if (props.endpoint) {
      const {scheme, path, interval, port, targetPort} = props.endpoint;
      const portIndex = props.ports.findIndex((p) =>
        (port !== null && port !== undefined) ? p.name === port : p.targetPort === targetPort);
      this.state = {scheme, path, interval, portIndex, inProgress: false, errorMessage: '',};
    } else {
      this.state = {
        scheme: 'HTTPS',
        path: '/',
        interval: '30s',
        portIndex: 0,
        inProgress: false,
        errorMessage: '',
      };
    }
  }

  validateInput(): Error {
    if (_.isEmpty(this.state.path)) {
      return new Error("Please provide a path");
    } else {
      return null;
    }
  }
  async createEndpoint(): Promise<ServiceMonitorEndpoint> {
    const err = this.validateInput();
    if (err !== null) {
      throw err;
    } else {
      const {ports} = this.props;
      const {scheme, path, interval, portIndex} = this.state;
      const port = ports[portIndex];

      return {
        path,
        scheme,
        interval,
        port: port.name,
        targetPort: port.targetPort,
      };
    }
  }
  submit(e: React.SyntheticEvent<EventTarget>) {
    e.preventDefault();

    this.handlePromise(this.createEndpoint()).then(
      (endpoint) => {
        const {action, close} = this.props;
        action && action(endpoint);
        close(endpoint);
      }
    );
  }
  render() {
    const {scheme, path, interval, portIndex} = this.state;
    const ports = this.props.ports.reduce(
      (acc, port, index) => {
        acc[index] = port.targetPort ? `Target Port: ${port.targetPort}` : `Port Name: ${port.name}`;
        return acc;
      },
      {}
    );
    return <form name="endpoint-form" className="modal-content modal-content--no-inner-scroll" onSubmit={this.submit.bind(this)}>
      <ModalTitle>{this.props.endpoint ? 'Edit Endpoint': 'Create Endpoint'}</ModalTitle>
      <ModalBody>
        <div className="form-group co-create-servicemonitor__endpoint__scheme">
          <label className="control-label co-required" htmlFor="scheme">Scheme</label>
          <Dropdown
            id="scheme"
            items={HTTPSchemeList}
            selectedKey={scheme}
            dropDownClassName="dropdown--full-width"
            onChange={(s: string) => this.setState({scheme: s as HTTPScheme})}
          />
        </div>
        <div className="form-group co-create-servicemonitor__endpoint__path">
          <label className="control-label co-required" htmlFor="path">Path</label>
          <input
            id="path"
            name="path"
            type="text"
            value={path}
            className="pf-c-form-control"
            onChange={(e) => this.setState({path: e.target.value})}
          />
        </div>
        <div className="form-group co-create-servicemonitor__endpoint__interval">
          <label className="control-label co-required" htmlFor="interval">Interval</label>
          <Dropdown
            id="interval"
            items={DurationList}
            selectedKey={interval}
            dropDownClassName="dropdown--full-width"
            onChange={(s: string) => this.setState({interval: s as Duration})}
          />
        </div>
        <div className="form-group co-create-servicemonitor__endpoint__port">
          <label className="control-label co-required" htmlFor="port">Port</label>
          <Dropdown
            id="port"
            items={ports}
            selectedKey={portIndex}
            dropDownClassName="dropdown--full-width"
            onChange={(portIndex: any) => this.setState({portIndex})}
          />
        </div>
      </ModalBody>
      <ModalSubmitFooter
          errorMessage={this.state.errorMessage}
          inProgress={this.state.inProgress}
          submitText={this.props.endpoint ? 'Update' : 'Create'}
          submitDisabled={this.validateInput() !== null}
          cancel={this.props.cancel.bind(this)}
      />
    </form>
  }
};

export const endpointEditor = createModalLauncher(EndpointEditor);
