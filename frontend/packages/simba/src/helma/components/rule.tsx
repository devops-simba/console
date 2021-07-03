import * as _ from 'lodash';
import * as React from 'react';
//import { Button } from '@patternfly/react-core'
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
  PromiseComponent,
  PromiseComponentState,
  ModalComponentProps,
  createModalLauncher,

  KeyValuePair,
  KeyValueEditor,

  // editCollectionAction,
  // deleteFromCollectionAction,
} from '../../components'
import {
  HelmaRule,
  HelmaCluster,
  HelmaCacheAge,
} from '../models'

//import { serializeCyclicObject } from '../../utils'

const CACHE_AGES = {
  '0s': '0s',
  '1s': '1s',
  '2s': '2s',
  '3s': '3s',
  '4s': '4s',
  '5s': '5s',
  '6s': '6s',
  '7s': '7s',
  '8s': '8s',
  '9s': '9s',
  '10s': '10s',
  '30s': '30s',
  '1m': '1m',
  '3m': '3m',
  '5m': '5m',
  '10m': '10m',
  '30m': '30m',
  '45m': '45m',
  '1h': '1h',
  '3h': '3h',
  '5h': '5h',
  '10h': '10h',
  '12h': '12h',
  '24h': '24h',
  '3d': '3d',
  '7d': '7d',
  '10d': '10d',
  '15d': '15d',
  '30d': '30d',
};

export type RuleEditorProps = {
  seq?: number;
  obj?: HelmaRule;
  clusters: HelmaCluster[];
  action?: (obj: HelmaRule) => void;
} & ModalComponentProps;
type ruleEditorState = {
  cluster: string;
  customHeaders: KeyValuePair[];
  customVariableInCookie?: string;
  hostname?: string;
  location: string;
  seq: number;
  browserCacheMaxAge?: HelmaCacheAge;
  serverCacheMaxAge?: HelmaCacheAge;
  serverCacheMaxAgeForNon200?: HelmaCacheAge;
} & PromiseComponentState;
function emptyState(seq: number): Omit<ruleEditorState, keyof PromiseComponentState> {
  return {
    seq,
    cluster: '',
    location: '/',
    customHeaders: [],
  };
}
function createState(rule: HelmaRule): Omit<ruleEditorState, keyof PromiseComponentState> {
  return {
    seq: rule.seq,
    cluster: rule.cluster,
    customHeaders: (rule.customHeaders || []).map(({name, value}) => ({key: name, value})),
    customVariableInCookie: rule.customVariableInCookie,
    location: rule.location,
    browserCacheMaxAge: rule.browserCacheMaxAge,
    serverCacheMaxAge: rule.serverCacheMaxAge,
    serverCacheMaxAgeForNon200: rule.serverCacheMaxAgeForNon200,
  };
}
export class RuleEditor extends PromiseComponent<RuleEditorProps, ruleEditorState> {
  constructor(props: RuleEditorProps) {
    super(props);

    const { obj, seq } = this.props;
    this.state = Object.assign({},
      obj ? createState(obj) : emptyState(seq),
      {errorMessage: '', inProgress: false});
  }

  _validateInput() : Error {
    if (this.state.seq !== null && this.state.seq < 0) {
      return new Error('Invalid sequence number');
    }
    if (_.isEmpty(this.state.location)) {
      return new Error('Please select a location');
    }
    if (_.isEmpty(this.state.cluster)) {
      return new Error('Please select a cluster');
    } else {
      return null;
    }
  }
  _createRule() : HelmaRule {
    const {
      cluster,
      hostname,
      customHeaders,
      customVariableInCookie,
      location,
      seq,
      browserCacheMaxAge,
      serverCacheMaxAge,
      serverCacheMaxAgeForNon200,
    } = this.state;
    return {
      cluster,
      hostname,
      customHeaders: customHeaders.map(({key, value}) => ({name: key, value})),
      customVariableInCookie,
      location,
      seq,
      browserCacheMaxAge,
      serverCacheMaxAge,
      serverCacheMaxAgeForNon200,
    }
  }
  _submit(e: React.FormEvent<EventTarget>) {
    e.preventDefault();

    const {close, action} = this.props;
    const err = this._validateInput();
    const promise = err !== null
      ? Promise.reject<HelmaRule>(err)
      : Promise.resolve<HelmaRule>(this._createRule());
    this.handlePromise(promise).then(
      (obj) => {
        action && action(obj);
        close(obj);
      },
    );
  }

  render() {
    const title = this.props.obj ? 'Edit': 'Add';
    const {
      cluster,
      customHeaders,
      customVariableInCookie,
      hostname,
      location,
      seq,
      browserCacheMaxAge,
      serverCacheMaxAge,
      serverCacheMaxAgeForNon200,
    } = this.state;
    const clusters = this.props.clusters.reduce(
      (acc, {name}) => {
        acc[name] = name;
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
        <ModalTitle>{title} Rule</ModalTitle>
        <ModalBody>
        <div className="form-group">
            <label htmlFor="input-seq" className="conrol-label co-required">Sequence</label>
            <div className="modal-body__field">
              <input
                id="input-seq"
                data-test="input-seq"
                name="seq"
                type="text"
                className="pf-c-form-control"
                aria-describedby="seq-help"
                pattern="[0-9]*"
                value={seq}
                onChange={(e) => this.setState({
                  seq: _.isEmpty(e.target.value) ? null : Number(e.target.value),
                  errorMessage: '', // reset possible error
                })}
              />
            </div>
            <div className="help-block" id="seq-help">
              Order of this rule in list of rules. Pass 0 to put item in front of the list and
              an empty value for end of the list
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="input-location" className="co-required conrol-label">Location</label>
            <div className="modal-body__field">
              <input
                id="input-location"
                data-test="input-location"
                name="location"
                type="text"
                className="pf-c-form-control"
                value={location}
                aria-describedby="location-help"
                onChange={(e) => this.setState({
                  location: e.target.value,
                  errorMessage: '', // reset possible error
                })}
              />
            </div>
            <div className="help-block" id="location-help">
              HTTP request location
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="dropdown-cluster" className="control-label co-required">Cluster</label>
            <div className="modal-body__field">
              <Dropdown
                id='dropdown-cluster'
                items={clusters}
                selectedKey={cluster}
                describedBy="cluster-help"
                dropDownClassName="dropdown--full-width"
                onChange={(cluster: string) => this.setState({
                  cluster,
                  errorMessage: '', // reset possible error
                })}
              />
            </div>
            <div className='help-block' id='cluster-help'>
              Cluster that this rule must applied to it
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="dropdown-browserCacheMaxAge" className="conrol-label">Browser Cache Max Age</label>
            <div className="modal-body__field">
              <Dropdown
                id="dropdown-browserCacheMaxAge"
                items={CACHE_AGES}
                selectedKey={browserCacheMaxAge}
                describedBy="browserCacheMaxAge-help"
                dropDownClassName="dropdown--full-width"
                onChange={(browserCacheMaxAge: string) => this.setState({
                  browserCacheMaxAge: browserCacheMaxAge as HelmaCacheAge,
                  errorMessage: '', // reset possible error
                })}
              />
            </div>
            <div className="help-block" id="browserCacheMaxAge-help">
              Cache time for client's browser
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="dropdown-serverCacheMaxAge" className="conrol-label">Server Cache Max Age</label>
            <div className="modal-body__field">
              <Dropdown
                id="dropdown-serverCacheMaxAge"
                items={CACHE_AGES}
                selectedKey={serverCacheMaxAge}
                describedBy="serverCacheMaxAge-help"
                dropDownClassName="dropdown--full-width"
                onChange={(serverCacheMaxAge: string) => this.setState({
                  serverCacheMaxAge: serverCacheMaxAge as HelmaCacheAge,
                  errorMessage: '', // reset possible error
                })}
              />
            </div>
            <div className="help-block" id="serverCacheMaxAge-help">
              Cache time for CDN provider for backend's response
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="dropdown-serverCacheMaxAgeForNon200" className="conrol-label">Server Cache Max Age For Non 200 Responses</label>
            <div className="modal-body__field">
              <Dropdown
                id="dropdown-serverCacheMaxAgeForNon200"
                items={CACHE_AGES}
                selectedKey={serverCacheMaxAgeForNon200}
                describedBy="serverCacheMaxAgeForNon200-help"
                dropDownClassName="dropdown--full-width"
                onChange={(serverCacheMaxAgeForNon200: string) => this.setState({
                  serverCacheMaxAgeForNon200: serverCacheMaxAgeForNon200 as HelmaCacheAge,
                  errorMessage: '', // reset possible error
                })}
              />
            </div>
            <div className="help-block" id="serverCacheMaxAgeForNon200-help">
              Cache time for CDN provider for backend's non 200 HTTP responses
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="input-customVariableInCookie" className="conrol-label">Custom Variable In Cookie</label>
            <div className="modal-body__field">
              <input
                id="input-customVariableInCookie"
                data-test="input-customVariableInCookie"
                name="customVariableInCookie"
                type="text"
                className="pf-c-form-control"
                value={customVariableInCookie || ''}
                aria-describedby="customVariableInCookie-help"
                onChange={(e) => this.setState({
                  customVariableInCookie: e.target.value,
                  errorMessage: '', // reset possible error
                })}
              />
            </div>
            <div className="help-block" id="customVariableInCookie-help">
              Cookie variables that will be set by CDN provider before sending request to your application
            </div>
          </div>
          <div className="form-group">
            <label className="control-label">Custom Host Header</label>
            <div className="modal-body__field">
              <input
                id="input-customHostHeader"
                data-test="input-customHostHeader"
                name="customHostHeader"
                type="text"
                className="pf-c-form-control"
                value={hostname || ''}
                aria-describedby="customHostHeader-help"
                onChange={(e) => this.setState({
                  hostname: e.target.value || null,
                  errorMessage: '', // reset possible error
                })}
              />
            </div>
            <div className="help-block" id="customHostHeader-help">
              Host header that will be passed to the CDN backend,
              by default this is same as what enetered by the user
            </div>
          </div>
          <div className="form-group">
            <label className="conrol-label">Custom Headers</label>
            <div className="modal-body__field">
              <KeyValueEditor
                pairs={customHeaders}
                removeAction={(index: number) => this.setState(({customHeaders}) => {
                  const ch = [...customHeaders];
                  ch.splice(index, 1);
                  return {customHeaders: ch};
                })}
                validator={(key, _) => {
                  return /^[^ \t\(\)<>@,;:\\\"\/\[\]?={}.]+$/.test(key||'');
                }}
                addAction={(key: string, value: string) => this.setState(({customHeaders}) => {
                  if (customHeaders.findIndex((h) => h.key === key && h.value === value) !== -1) {
                    return {customHeaders: customHeaders};
                  } else {
                    return {customHeaders: [...customHeaders, {key, value}]}
                  }
                })}
              />
            </div>
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
export const ruleEditor = createModalLauncher(RuleEditor);

const ruleColumnClasses = [
  '',   // location
  '',   // cluster
  '',   // cache

];
const ruleListHeaders = () => {
  return [
    {
      title: 'Location',
      sortField: 'location',
      transforms: [],
      props: { className: ruleColumnClasses[0] },
    },
    {
      title: 'Cluster',
      sortField: 'cluster',
      transforms: [],
      props: { className: ruleColumnClasses[1] },
    },
    {
      title: 'Cache',
      props: { className: ruleColumnClasses[2] },
    },
    {
      title: '',  // Kebab header
      props: { className: Kebab.columnClass },
    },
  ];
};

export type RuleListProps = {
  clusters: HelmaCluster[];
  editAction: (rule: HelmaRule, index: number) => void;
  deleteAction: (index: number) => void;
  rules: HelmaRule[];
};
export const RuleList: React.FC<RuleListProps> = ({editAction, deleteAction, rules, clusters}) => {
  const row: RowFunction<HelmaRule> = ({obj, index, key, style}) => {
    const menuActions = [
      {
        label: 'Edit Rule',
        callback: () => {
          ruleEditor({
            clusters,
            obj: rules[index],
            action: (obj: HelmaRule) => editAction(obj, index),
          })
        },
      },
      {
        label: 'Delete Rule',
        callback: () => deleteAction(index),
      },
    ];

    const {
      cluster,
      location,
      serverCacheMaxAge,
      browserCacheMaxAge,
      serverCacheMaxAgeForNon200
    } = obj;
    const cache = (
      (serverCacheMaxAge && serverCacheMaxAge != '0s') ||
      (browserCacheMaxAge && browserCacheMaxAge != '0s') ||
      (serverCacheMaxAgeForNon200 && serverCacheMaxAgeForNon200 != '0s')) ? 'Enabled': '';
    return <TableRow id={`rule-${index}`} index={index} trKey={key} style={style}>
      <TableData className={ruleColumnClasses[0]}>
        <span>{location}</span>
      </TableData>
      <TableData className={ruleColumnClasses[1]}>
        <span>{cluster}</span>
      </TableData>
      <TableData className={ruleColumnClasses[2]}>
        <span>{cache}</span>
      </TableData>
      <TableData className={Kebab.columnClass}>
        <Kebab options={menuActions} />
      </TableData>
    </TableRow>
  };

  return <Table
    data={rules}
    Header={ruleListHeaders}
    aria-label="Rules"
    defaultSortField="cluster"
    Row={row}
    loaded={true}
    virtualize
  />
};
