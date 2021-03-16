import {
  K8sResourceCommon,
  K8sKind,
  Selector,
} from '@console/internal/module/k8s';

//#region [Duration]
export type Duration =
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
  | '20s'
  | '30s'
  | '1m'
  | '2m'
  | '3m'
  | '4m'
  | '5m'
  | '10m'
  ;
export const DurationList = {
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
  '20s': '20s',
  '30s': '30s',
  '1m': '1m',
  '2m': '2m',
  '3m': '3m',
  '4m': '4m',
  '5m': '5m',
  '10m': '10m',
};
//#endregion

//#region [HTTPScheme]
export type HTTPScheme = 'HTTP'|'HTTPS';
export const HTTPSchemeList = {
  HTTP: 'HTTP',
  HTTPS: 'HTTPS',
};
//#endregion

export type KeyNameOptional = {
  key: string;
  name?: string;
  optional?: boolean;
};
export type BasicAuth = {
  username: KeyNameOptional;
  password: KeyNameOptional;
};
export type ConfigMapOrSecret = {
  configMap?: KeyNameOptional;
  secret?: KeyNameOptional;
};
export type TlsConfig = {
  ca?: ConfigMapOrSecret;
  caFile?: string;
  cert?: ConfigMapOrSecret;
  certFile?: string;
  insecureSkipVerify?: boolean;
  keyFile?: string;
  keySecret?: KeyNameOptional;
  serverName?: string;
};
export type RelabelingInfo = {
  action?: string;
  modulus?: number;
  regex?: string;
  replacement?: string;
  separator?: string;
  sourceLabels?: string[];
  targetLabel?: string;
};
export type ServiceMonitorEndpoint = {
  interval?: Duration;
  path?: string;
  port?: string;
  targetPort?: string;
  scheme?: HTTPScheme;
  scrapeTimeout?: Duration;
  basicAuth?: BasicAuth;
  bearerTokenFile?: string;
  bearerTokenSecret?: KeyNameOptional;
  honorLabels?: boolean;
  honorTimestamps?: boolean;
  metricRelabelings?: RelabelingInfo;
  relabelings?: RelabelingInfo;
  params?: {[key: string]: string};
  proxyUrl?: string;
  tlsConfig?: TlsConfig;
};
export type ServiceMonitorSpec = {
  endpoints: ServiceMonitorEndpoint[];
  selector: Selector;
  jobLabel?: string;
  namespaceSelector?: Selector;
  podTargetLabels?: string[];
  sampleLimit?: number;
  targetLabels?: string[];
};

export type ServiceMonitorKind = {
  spec: ServiceMonitorSpec;
} & K8sResourceCommon;

export const ServiceMonitorModel: K8sKind = {
  id: 'servicemonitor',
  apiGroup: 'monitoring.coreos.com',
  apiVersion: 'v1',
  namespaced: true,
  kind: 'ServiceMonitor',
  abbr: 'servicemonitor',
  label: 'ServiceMonitor',
  labelPlural: 'ServiceMonitors',
  plural: 'servicemonitors',

  crd: true,
  //legacyPluralURL: true,
};
