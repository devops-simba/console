import { Zone } from './types';

export const availableZones: Zone[] = [
  new Zone('afranet', 'Afranet', 'afra', ['afr']),
  new Zone('asiatech', 'Asiatech', 'asia', [], false),
  new Zone('irancell', 'Irancell', 'ic', []),
];

export const enabledZones = availableZones.filter((z) => z.enabled);
export const enabledZonesMapById = enabledZones.reduce(
  (acc, {name, displayName}) => {
    acc[name] = displayName;
    return acc;
  },
  {}
);
export const enabledZonesMapByIndicator = enabledZones.reduce(
  (acc, {zoneIndicator, displayName}) => {
    acc[zoneIndicator] = displayName;
    return acc;
  },
  {}
);

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
