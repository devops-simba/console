import { Zone } from './types';

export const availableZones: Zone[] = [
  new Zone('afranet', 'Afranet', 'a', 'afra'),
  new Zone('irancell', 'Irancell', 'i', 'ic'),
  new Zone('asiatech', 'Asiatech', 's', 'asia', false),
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
