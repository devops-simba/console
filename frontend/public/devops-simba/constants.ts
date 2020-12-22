import { Zone } from './types';

export const availableZones: Zone[] = [
  new Zone('irancell', 'Irancell'),
  new Zone('afranet', 'Afranet'),
  new Zone('asiatech', 'Asiatech', false),
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
  projectEnvironment: 'project-environment',
};
