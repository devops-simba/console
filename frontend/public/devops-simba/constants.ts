import { Zone } from './types';

export const availableZones: Zone[] = [
  new Zone('afranet', 'Afranet', 'a'),
  new Zone('irancell', 'Irancell', 'i'),
  new Zone('asiatech', 'Asiatech', 's', false),
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
