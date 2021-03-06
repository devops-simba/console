import * as _ from 'lodash';
import { K8sResourceCommon } from '../module/k8s/types';
import { K8sResourceKind } from '@console/internal/module/k8s';

import { Zone } from './types';
import { knownAnnotations, enabledZones } from './constants';

export const DEVOPS_ZONE_PREFIX = 'zones.devops.snapp.ir/';
export const DEVOPS_ZONE_VALUE = 'true';

export function findZone(z: string) {
  const i = enabledZones.findIndex(
    (az) => az.zoneIndicator === z || az.alternateIndicators.indexOf(z) !== -1,
  );
  return i === -1 ? null : enabledZones[i];
}
export function getZones(obj: K8sResourceKind): Zone[] {
  const zone = _.get(obj?.metadata?.annotations, 'openshift.io/node-selector');
  if (!zone) {
    return null;
  }

  let devopsZones: Zone[] = null;
  let ocZone: Zone = null;

  const directives = zone.split(',');
  for (let i = 0; i < directives.length; i++) {
    const directive = directives[i];
    const eq = directive.indexOf('=');
    if (eq === -1) {
      throw Error(`${obj.metadata.name}: Invalid zone selector(no equal sign): ${zone}`);
    }
    const key = directive.substring(0, eq);
    const value = directive.substr(eq+1);
    if (key.startsWith(DEVOPS_ZONE_PREFIX)) {
      if (devopsZones || ocZone) {
        throw Error(`${obj.metadata.name}: Invalid zone selector(multiple zone selectors): ${zone}`);
      }
      if (value !== DEVOPS_ZONE_VALUE) {
        throw Error(`${obj.metadata.name}: Invalid zone selector(invalid value): value of '${key}' must be true but it is '${value}'`);
      }

      const zoneNames = key
        .substr(DEVOPS_ZONE_PREFIX.length)
        .split('-');
      devopsZones = zoneNames.map((z) => findZone(z));
      if (!devopsZones) {
        throw Error(`${obj.metadata.name}: Invalid zone selector(missing zone name): ${zoneNames}`)
      }

      const unknownZoneNames = devopsZones.filter((z) => z === null);
      if (unknownZoneNames.length) {
        throw Error(`${obj.metadata.name}: Invalid zone selector(unknown zone name): ${zoneNames}`)
      }
    } else if (value && key === 'zone') {
      if (ocZone || devopsZones) {
        throw Error(`${obj.metadata.name}: Invalid zone selector(multiple zone selectors): ${zone}`);
      }
      ocZone = findZone(value);
      if (!ocZone) {
        throw Error(`${obj.metadata.name}: Invalid zone selector(Invalid zone name): ${value}`);
      }
    }
  }
  if (devopsZones) {
    return devopsZones;
  }
  if (ocZone) {
    return [ocZone];
  }
  return null;
}
export function getZoneName(obj: K8sResourceKind) {
  try {
    const zones = getZones(obj);
    if (zones === null) {
      return enabledZones
        .map((z) => z.displayName)
        .join(', ');
    }

    return zones.map((z) => z.displayName).join(', ');
  } catch (e) {
    /* eslint-disable no-console */
    console.error(`EditProjectModal: ${e}`);
    return '<UNSCHEDULABLE(Invalid selector)>';
  }
}

export function updateNodeSelector(model: K8sResourceCommon, selectedZones: Zone[]) {
  if (enabledZones.length === selectedZones.length) {
    return;
  }

  const zoneNames = selectedZones.map((z) => z.name);
  if (!model.metadata.annotations) {
    model.metadata.annotations = {};
  }
  model.metadata.annotations[
    knownAnnotations.openshiftNodeSelector
  ] = `topology.kubernetes.io/zone=${zoneNames.join(',')}`;
}

/* eslint-disable no-useless-escape */
const zoneIndicatorPattern = /^[^\.]+\.[^\.]+\.([^\.]+)\..*$/;
export function findNodeZone(nodeName: string): Zone {
  const m = nodeName.match(zoneIndicatorPattern);
  if (!m) {
    return null;
  }

  const zoneIndicator = m[1];
  const index = enabledZones.findIndex((z) => z.zoneIndicator === zoneIndicator);
  if (index === -1) {
    return null;
  }
  return enabledZones[index];
}
