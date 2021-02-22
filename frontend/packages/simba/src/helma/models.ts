//import { ObjectMetadata } from '../module/k8s/types'
import { K8sResourceCommon, K8sKind } from '@console/internal/module/k8s/types';

export type HelmaClusterType = 'dns' | 'ip';
export type HelmaClusterProtocol = 'http' | 'https' | 'default' | 'auto';
//#region [HelmaCacheAge]
export type HelmaCacheAge =
  | '0s'
  | '1s'
  | '2s'
  | '3s'
  | '4s'
  | '5s'
  | '6s'
  | '7s'
  | '8s'
  | '9s'
  | '10s'
  | '30s'
  | '1m'
  | '3m'
  | '5m'
  | '10m'
  | '30m'
  | '45m'
  | '1h'
  | '3h'
  | '5h'
  | '10h'
  | '12h'
  | '24h'
  | '3d'
  | '7d'
  | '10d'
  | '15d'
  | '30d';
//#endregion
export type HelmaFirewallAction = 'allow' | 'deny';

export type HelmaCustomHeader = {
  name: string;
  value: string;
};

export type HelmaClusterServer = {
  address?: string;
  zone?:string;
  serviceName?: string;
  servicePort?: string;
  port?: number;
  weight?: number;
};
export type HelmaCluster = {
  name: string;
  type?: HelmaClusterType;
  protocol?: HelmaClusterProtocol;
  servers: HelmaClusterServer[];
};
export type HelmaRule = {
  cluster: string;
  customHeaders?: HelmaCustomHeader[];
  customVariableInCookie?: string;
  hostname?: string;
  location: string;
  seq: number;
  browserCacheMaxAge?: HelmaCacheAge;
  serverCacheMaxAge?: HelmaCacheAge;
  serverCacheMaxAgeForNon200?: HelmaCacheAge;
};
export type HelmaFirewall = {
  note?: string;
  action?: HelmaFirewallAction;
  sources: string[];
  /* eslint-disable camelcase */
  url_pattern?: string;
};

export type HelmaSpec = {
  domain: string;
  clusters: HelmaCluster[];
  firewall: HelmaFirewall[];
  rules: HelmaRule[];
};

export type HelmaStatus = {
  domain: string;
  domainUuid: string;
  phase: string;
  reviewedGeneration: number;
  reviewedSpec: string;
  tlsRetry: boolean;
};

export type HelmaKind = {
  spec?: HelmaSpec;
  status?: HelmaStatus;
} & K8sResourceCommon;

export const NoCRD_HelmaModel: K8sKind = {
  id: 'cdn',
  namespaced: true,
  label: 'CDN',
  labelPlural: 'CDNs and WAFs',
  apiVersion: 'v1',
  apiGroup: 'devops.snapp.ir',
  plural: 'cdns',
  abbr: 'cdn',
  kind: 'CDN',
};
export const HelmaModel: K8sKind = Object.assign({}, NoCRD_HelmaModel, {
  crd: true,
  legacyPluralURL: true,
});
