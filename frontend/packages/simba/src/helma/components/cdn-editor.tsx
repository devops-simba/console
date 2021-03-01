import * as _ from 'lodash';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { ActionGroup, Button } from '@patternfly/react-core';

import { getActiveNamespace } from '@console/internal/actions/ui';
import { K8sResourceKind, k8sCreate } from '@console/internal/module/k8s';
import { ButtonBar, history, } from '@console/internal/components/utils';

import {
  editCollectionAction,
  deleteFromCollectionAction,
} from '../../components';
import {
  HelmaModel,
  HelmaCluster,
  HelmaFirewall,
  HelmaRule,
} from '../models';
import {
  clusterEditor,
  ClusterList,
} from './cluster';
import {
  firewallEditor,
  FirewallList,
} from './firewall';
import {
  ruleEditor,
  RuleList,
} from './rule';

import './_components.scss';

/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable no-underscore-dangle */
/* eslint-disable promise/catch-or-return */

type cdnEditorState = {
  inProgress: boolean;
  error: string;
  namespace: string;

  name: string;
  domain?: string;
  clusters: HelmaCluster[];
  rules: HelmaRule[];
  firewalls: HelmaFirewall[];
};

function fixCluster(cluster: HelmaCluster): HelmaCluster {
  const result: HelmaCluster = {
    name: cluster.name,
    servers: cluster.servers,
  };
  if (cluster.type !== null) {
    result.type = cluster.type;
  }
  if (cluster.protocol !== null) {
    result.protocol = cluster.protocol;
  }

  return result;
}
function fixFirewall(firewall: HelmaFirewall): HelmaFirewall {
  const result: HelmaFirewall = {
    sources: firewall.sources,
  };
  if (firewall.action !== null) {
    result.action = firewall.action;
  }
  if (firewall.url_pattern !== null) {
    result.url_pattern = firewall.url_pattern;
  }
  if (firewall.note !== null) {
    result.note = firewall.note;
  }

  return result;
}
function maxSequenceNumber(rules: HelmaRule[]): number {
  return rules.reduce(
    (max, {seq}) => max < seq ? seq : max,
    0
  );
}
function fixRule(rules: HelmaRule[], rule: HelmaRule): HelmaRule {
  const result: HelmaRule = {
    cluster: rule.cluster,
    seq: rule.seq === null ? maxSequenceNumber(rules) : rule.seq,
  };
  if (!_.isEmpty(rule.customHeaders)) {
    result.customHeaders = rule.customHeaders;
  }
  if (!_.isEmpty(rule.customVariableInCookie)) {
    result.customVariableInCookie = rule.customVariableInCookie;
  }
  if (!_.isEmpty(rule.location)) {
    result.location = rule.location;
  }
  if (rule.browserCacheMaxAge) {
    result.browserCacheMaxAge = rule.browserCacheMaxAge;
  }
  if (rule.serverCacheMaxAge) {
    result.serverCacheMaxAge = rule.serverCacheMaxAge;
  }
  if (rule.serverCacheMaxAgeForNon200) {
    result.serverCacheMaxAgeForNon200 = rule.serverCacheMaxAgeForNon200;
  }

  return result;
}
function addNewRule(rules: HelmaRule[], rule: HelmaRule): HelmaRule[] {
  const newRules = [...rules];
  const fixedRule = fixRule(rules, rule);
  const n = newRules.findIndex((r) => r.seq > fixedRule.seq);
  if (n === -1) {
    newRules.push(fixedRule);
  } else {
    newRules.splice(n, 0, fixedRule);
  }
  _.each(
    newRules,
    (r, index) => {
      r.seq = index + 1;
    }
  )
  return newRules;
}
function updateRule(rules: HelmaRule[], rule: HelmaRule, index: number): HelmaRule[] {
  const newRules = [...rules];
  newRules.splice(index, 1);
  return addNewRule(newRules, rule);
}
export class CDNEditor extends React.Component<{}, cdnEditorState> {
  state = {
    inProgress: false,
    error: '',
    namespace: getActiveNamespace(),

    name: '',
    domain: '',
    clusters: [],
    firewalls: [],
    rules: [],
  };

  _handleChange: React.ReactEventHandler<HTMLInputElement> = (event) => {
    const { name, value } = event.currentTarget;
    this.setState({[name]: value} as any);
  };
  _validateInput() {
    const { name, clusters } = this.state;
    if (_.isEmpty(name)) {
      return new Error('Please enter a valid name');
    }
    if (_.isEmpty(clusters)) {
      return new Error('You must add at least one cluster');
    }
    return null;
  }
  _createCDN() {
    const { name, namespace, domain, clusters, firewalls, rules } = this.state;
    const obj: K8sResourceKind = {
      kind: HelmaModel.kind,
      apiVersion: `${HelmaModel.apiGroup}/${HelmaModel.apiVersion}`,
      metadata: {
        name,
        namespace,
      },
      spec: {
        clusters,
      },
    };
    if (!_.isEmpty(firewalls)) { obj.spec.firewall = firewalls }
    if (!_.isEmpty(domain)) { obj.spec.domain = domain }
    if (!_.isEmpty(rules)) {
      obj.spec.rules = [];
      _.each(
        rules,
        (r, index) => {
          const rule = {...r};
          rule.seq = index + 2;
          obj.spec.rules.push(rule);
        }
      )
    }
    return obj;
  }
  _submit: React.ReactEventHandler<EventTarget> = (event) => {
    event.preventDefault();

    const {name, namespace} = this.state;
    const err = this._validateInput();
    const promise = err === null
      ? Promise.resolve<K8sResourceKind>(this._createCDN())
      : Promise.reject<K8sResourceKind>(err);

    promise.then((obj) => k8sCreate(HelmaModel, obj)).then(
      () => {
        this.setState({ inProgress: false });
        history.push(`/k8s/ns/${namespace}/cdns/${name}`);
      },
      (e) =>
        this.setState({
          error: e.message,
          inProgress: false,
        }),
    );
  };

  render() {
    const title = 'Create CDN'
    const {name, namespace, clusters, firewalls, rules} = this.state;
    const addCluster = () => {
      clusterEditor({
        namespace: this.state.namespace,
        action: (obj: HelmaCluster) => {
          this.setState(({clusters}) => ({clusters: [...clusters, fixCluster(obj)]}))
        },
      });
    };
    const addFirewall = () => {
      firewallEditor({
        action: (obj: HelmaFirewall) => {
          this.setState(({firewalls}) => ({firewalls: [...firewalls, fixFirewall(obj)]}))
        },
      });
    };
    const addRule = () => {
      ruleEditor({
        seq: maxSequenceNumber(this.state.rules),
        clusters: this.state.clusters,
        action: (obj: HelmaRule) => {
          this.setState(({rules}) => ({rules: addNewRule(rules, obj)}));
        },
      });
    };
    return <>
      <div className="co-m-pane__body co-m-pane__form">
        <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
          <div className="co-m-pane__name">{title}</div>
          <div className="co-m-pane__heading-link">
            <Link
              to={`/k8s/ns/${namespace}/cdns/~new`}
              id="yaml-link"
              data-test="yaml-link"
              replace>
              Edit YAML
            </Link>
          </div>
        </h1>
        <p className="co-m-pane__explanation">
          CDN is a way to load balance your application traffic and put it behind a firewall.
        </p>
        <form onSubmit={this._submit.bind(this)} className="co-create-cdn">
          <div className="form-group co-create-cdn__name">
            <label className="control-label co-required" htmlFor="name">Name</label>
            <input
              className="pf-c-form-control"
              type="text"
              onChange={this._handleChange.bind(this)}
              value={name}
              placeholder="my-cdn"
              id="name"
              name="name"
              aria-describedby="name-help"
              required
            />
            <div className="help-block" id="name-help">
              <p>A unique name for the CDN within the project.</p>
            </div>
          </div>
          <div className="form-group co-create-cdn__domain">
            <label className="control-label" htmlFor="domain">Domain</label>
            <input
              className="pf-c-form-control"
              type="text"
              onChange={this._handleChange.bind(this)}
              value={this.state.domain}
              placeholder="www.example.com"
              id="domain"
              name="domain"
              aria-describedby="domain-help"
            />
            <div className="help-block" id="domain-help">
              <p>Domain for the CDN.</p>
            </div>
          </div>
          <div className="form-group co-create-cdn__clusters">
            <h2 className="co-m-pane__heading co-m-pane__heading--baseline">
              <div className="co-m-pane__name">Clusters</div>
              <div className="co-m-pane__heading-link">
                <Button onClick={addCluster} className="add-component-button">
                  Add New Cluster
                </Button>
              </div>
            </h2>
            {!_.isEmpty(clusters) && (
              <ClusterList
                clusters={this.state.clusters}
                namespace={this.state.namespace}
                editAction={editCollectionAction(this, 'clusters', fixCluster)}
                deleteAction={deleteFromCollectionAction(this, 'clusters', 'Cluster')}
                />
            )}
          </div>
          {!_.isEmpty(clusters) && (
            <div className="form-group co-create-cdn__rules">
              <h2 className="co-m-pane__heading co-m-pane__heading--baseline">
                <div className="co-m-pane__name">Page Rules</div>
                <div className="co-m-pane__heading-link">
                  <Button onClick={addRule} className="add-component-button">
                    Add New Page Rule
                  </Button>
                </div>
              </h2>
              {!_.isEmpty(rules) && (
                <RuleList
                  clusters={clusters}
                  rules={rules}
                  editAction={(rule, index) =>
                    this.setState(({rules}) => ({rules: updateRule(rules, rule, index)}))
                  }
                  deleteAction={deleteFromCollectionAction(this, 'rules', 'Rule')}
                  />
              )}
            </div>
          )}
          <div className="form-group co-create-cdn__firewalls">
            <h2 className="co-m-pane__heading co-m-pane__heading--baseline">
              <div className="co-m-pane__name">Firewall Rules</div>
              <div className="co-m-pane__heading-link">
                <Button onClick={addFirewall} className="add-component-button">
                  Add New Firewall Rule
                </Button>
              </div>
            </h2>
            {!_.isEmpty(firewalls) && (
              <FirewallList
                firewalls={firewalls}
                editAction={editCollectionAction(this, 'firewalls', fixFirewall)}
                deleteAction={deleteFromCollectionAction(this, 'firewalls', 'Firewall')}
                />
            )}
          </div>
          <ButtonBar errorMessage={this.state.error} inProgress={this.state.inProgress}>
            <ActionGroup className="pf-c-form">
              <Button
                type="submit"
                isDisabled={this._validateInput() !== null}
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
  }
};
