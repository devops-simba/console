import { Zone } from './types';

export const availableZones: Zone[] = [
  new Zone('afranet', 'Afranet', 'afra', ['afr']),
  new Zone('asiatech', 'Asiatech', 'asia', [], false),
  new Zone('irancell', 'Irancell', 'ic', []),
];

export const projectEnvironments = {
  test: 'Test',
  staging: 'Staging',
  production: 'Production',
};

export const knownAnnotations = {
  openshiftNodeSelector: 'openshift.io/node-selector',
};

export const knownLabels = {
  projectEnvironment: 'environment',
};
