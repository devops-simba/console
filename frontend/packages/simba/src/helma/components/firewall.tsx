import * as _ from 'lodash';
import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import { CheckCircleIcon, CloseIcon } from '@patternfly/react-icons'

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
  OmitPromiseComponentState,
  KeyValueEditor,
} from '../../components'
import {
  HelmaFirewall,
  HelmaFirewallAction,
} from '../models'
import {
  countriesMap,
  countries,
  createView,
  //fiterCountries,
} from '../../k8s/consts'

/* eslint-disable no-underscore-dangle */
/* eslint-disable promise/catch-or-return */

const FIREWALL_ACTIONS = {
  deny: <span><CloseIcon color="red" size="sm" />{' '}Deny</span>,
  allow: <span><CheckCircleIcon color="green" size="sm" />{' '}Allow</span>,
};
const IPPart = String.raw`(?:\d{1,2}|(?:1\d{2})|(?:2[0-4]\d)|(?:25[0-5]))`;
const IPLen = String.raw`(?:(?:\d)|(?:[1-2]\d)|(?:3[0-2]))`
const IP_OR_NETWORK = new RegExp(`^${IPPart}\\.${IPPart}\\.${IPPart}\\.${IPPart}(?:\\/${IPLen})?$`);

export type FirewallEditorProps = {
  obj?: HelmaFirewall;
  action?: (obj: HelmaFirewall) => void;
} & ModalComponentProps;
type firewallEditorState = {
  id: number;
  sourceIps: string[];
  sourceCountries: string[];
  urlPattern?: string;
  faction: HelmaFirewallAction;
  note?: string;
} & PromiseComponentState;
function defaultFirewallState() : OmitPromiseComponentState<firewallEditorState> {
  return {
    id: Math.floor(Math.random() * 9999),
    faction: 'deny',
    sourceIps: [],
    sourceCountries: [],
  };
}
function firewallToState(obj: HelmaFirewall) : OmitPromiseComponentState<firewallEditorState> {
  const result: OmitPromiseComponentState<firewallEditorState> = {
    id: Math.floor(Math.random() * 9999),
    sourceIps: [],
    sourceCountries: [],
    faction: obj.action || 'deny',
    urlPattern: obj.url_pattern,
    note: obj.note,
  };
  _.each(
    obj.sources,
    (src) => {
      if (IP_OR_NETWORK.test(src)) {
        result.sourceIps.push(src);
      } else {
        result.sourceCountries.push(src);
      }
    }
  );
  return result;
}
export class HelmaFirewallEditor extends PromiseComponent<FirewallEditorProps, firewallEditorState> {
  constructor(props: FirewallEditorProps) {
    super(props);

    const { obj } = this.props;
    this.state = Object.assign({},
      obj ? firewallToState(obj) : defaultFirewallState(),
      {errorMessage: '', inProgress: false});
  }

  _validateInput(): Error {
    return null;
  }
  _createFirewall(): HelmaFirewall {
    const { sourceIps, sourceCountries, urlPattern, faction, note } = this.state;
    const firewall: HelmaFirewall = {
      action: faction,
      sources: [],
    };
    if (!_.isEmpty(sourceIps)) {
      firewall.sources.push(...sourceIps);
    }
    firewall.sources.push(...sourceCountries.map(sc => sc.toUpperCase()));
    if (!_.isEmpty(note)) {
      firewall.note = note;
    }
    if (!_.isEmpty(urlPattern)) {
      firewall.url_pattern = urlPattern;
    }
    return firewall;
  }
  _submit(e: React.FormEvent<EventTarget>) {
    e.preventDefault();

    const { close, action } = this.props;
    const err = this._validateInput();
    const promise = err !== null
      ? Promise.reject<HelmaFirewall>(err)
      : Promise.resolve(this._createFirewall());

    this.handlePromise(promise).then(
      (obj) => {
        action && action(obj);
        close(obj);
      }
    )
  }

  render() {
    const title = this.props.obj ? 'Edit' : 'Add';
    const { sourceIps, sourceCountries, urlPattern, faction, note } = this.state;

    return (
      <form
        name="form"
        className="modal-content modal-content--no-inner-scroll"
        onSubmit={this._submit.bind(this)}
        >
        <ModalTitle>{title} Firewall</ModalTitle>
        <ModalBody>
          <div className="form-group">
            <label htmlFor="dropdown-action" className="control-label">Action</label>
            <div className="modal-body__field">
              <Dropdown
                id='dropdown-action'
                items={FIREWALL_ACTIONS}
                selectedKey={faction}
                onChange={(a: string) => this.setState({
                  faction: a as HelmaFirewallAction,
                  errorMessage: '', // reset possible error
                })}
                dropDownClassName="dropdown--full-width"
                describedBy="action-help"
              />
            </div>
            <div className="help-block" id="action-help">
              Action to perform on incoming traffic(deny/allow)
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="input-url-pattern" className="control-label">URL Pattern</label>
            <div className="modal-body__field">
              <input
                id="input-url-pattern"
                name="input-url-pattern"
                onChange={(e) => this.setState({
                  urlPattern: e.target.value,
                  errorMessage: '' // reset error
                })}
                value={urlPattern}
                className="pf-c-form-control"
                aria-describedBy="url-pattern-help"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="input-source" className="control-label">Source IP or Network</label>
            <div className="modal-body__field">
              <div className="ips">
                <KeyValueEditor
                  noValue
                  pairs={sourceIps.map((ip) => ({key: ip}))}
                  removeAction={(index) => this.setState(({sourceIps}) => {
                    const ips = [...sourceIps];
                    ips.splice(index, 1);
                    return {sourceIps: ips};
                  })}
                  validator={(key, _) => IP_OR_NETWORK.test(key)}
                  addAction={(key, _) => this.setState(({sourceIps}) =>
                    sourceIps.indexOf(key) === -1
                      ? {sourceIps: [...sourceIps, key]}
                      : {sourceIps: sourceIps}
                  )}
                />
              </div>
            </div>
            <div className="help-block" id="source-ip-help">
              IPs or networks that firewall rule should applied to it
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="dropdown-country" className="control-label">Country</label>
            <div className="modal-body__field">
              {!_.isEmpty(sourceCountries) &&
                <KeyValueEditor
                  pairs={sourceCountries.map((sc) => ({ key: countriesMap[sc] }))}
                  removeAction={(index) => this.setState(({sourceCountries}) => {
                    const newSourceCountries = [...sourceCountries];
                    newSourceCountries.splice(index, 1);
                    return {sourceCountries: newSourceCountries};
                  })}
                />
              }
              <Dropdown
                id="dropdown-type"
                items={createView(countries.filter((sc) => sourceCountries.indexOf(sc.alpha2) === -1))}
                title="Select a country to add it to firewall rule"
                autocompleteFilter={(text: string, _item: string, key: string) => {
                  /* eslint-disable no-console */
                  const country = countries.find((c) => c.alpha2 === key);
                  text = text.toLowerCase();
                  return fuzzy(text, country.en.toLowerCase()) ||
                         fuzzy(text, country.fa.toLowerCase());
                }}
                onChange={(src: string) => this.setState(({sourceCountries}) => {
                  if (sourceCountries.indexOf(src) != -1) {}
                  return {
                    sourceCountries: [...sourceCountries, src],
                    errorMessage: '' // reset possible error
                  };
                })}
                dropDownClassName="dropdown--full-width"
                describedBy="country-help"
              />
            </div>
            <div className="help-block" id="country-help">
              Countries that firewall rule will be applied to them
            </div>
          </div>
          <div className="form-group">
            <h2 className="control-label">Note</h2>
            <textarea
              id="input-note"
              name="note"
              className="pf-c-form-control"
              value={note}
              onChange={(e) => this.setState({
                note: e.target.value,
                errorMessage: '', // reset possible error
              })}
            />
          </div>
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={this.state.errorMessage}
          inProgress={this.state.inProgress}
          submitText={this.props.obj ? 'Update' : 'Create'}
          cancel={this.props.cancel}
        />
      </form>
    )
  }
};
export const firewallEditor = createModalLauncher(HelmaFirewallEditor);

const firewallColumnClasses = [
  '',   // action
  '',   // source
  '',   // url_pattern

];
const firewallListHeaders = () => {
  return [
    {
      title: 'Action',
      sortField: 'action',
      transforms: [],
      props: { className: firewallColumnClasses[0] },
    },
    {
      title: 'Source',
      sortFunc: 'source',
      transforms: [],
      props: { className: firewallColumnClasses[1] },
    },
    {
      title: 'URL Pattern',
      sortField: 'url_pattern',
      transforms: [],
      props: { className: firewallColumnClasses[2] },
    },
    {
      title: '',  // Kebab header
      props: { className: Kebab.columnClass },
    },
  ];
};

export type FirewallListProps = {
  editAction: (firewall: HelmaFirewall, index: number) => void;
  deleteAction: (index: number) => void;
  firewalls: HelmaFirewall[];
};
export const FirewallList: React.FC<FirewallListProps> = ({editAction, deleteAction, firewalls}) => {
  const row: RowFunction<HelmaFirewall> = ({obj, index, key, style}) => {
    const { action, sources, url_pattern } = obj;
    const menuActions = [
      {
        label: 'Edit Firewall',
        callback: () => {
          firewallEditor({
            obj: firewalls[index],
            action: (obj: HelmaFirewall) => editAction(obj, index),
          })
        },
      },
      {
        label: 'Delete Firewall',
        callback: () => deleteAction(index),
      },
    ];

    const sourceItems = sources.map(
      (src) => {
        if (IP_OR_NETWORK.test(src)) {
          return <li>{src}</li>
        } else {
          const country = _.get(countriesMap, src) || src;
          return <li>{country}</li>
        }
      }
    );
    return <TableRow id={`firewall-${index}`} index={index} trKey={key} style={style}>
      <TableData className={firewallColumnClasses[0]}>
        {FIREWALL_ACTIONS[action]}
      </TableData>
      <TableData className={firewallColumnClasses[1]}>
        <span><ul>{sourceItems}</ul></span>
      </TableData>
      <TableData className={firewallColumnClasses[2]}>
        <span>{url_pattern}</span>
      </TableData>
      <TableData className={Kebab.columnClass}>
        <Kebab options={menuActions} />
      </TableData>
    </TableRow>
  };

  return <Table
    data={firewalls}
    Header={firewallListHeaders}
    aria-label="Firewalls"
    defaultSortField="source"
    Row={row}
    loaded={true}
    virtualize
  />
};
