import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { Zone } from './models';
import { availableZones } from './consts';

export const DEVOPS_ZONE_PREFIX = 'zones.devops.snapp.ir/';
export const DEVOPS_ZONE_VALUE = 'true';

export function getZones(obj: K8sResourceKind): Zone[] {
  const zone = _.get(obj?.metadata?.annotations, 'openshift.io/node-selector');
  if (!zone) {
    return null;
  }

  const findZone = (z: string) => {
    const i = availableZones.findIndex(
      (az) => az.zoneIndicator === z || az.alternateIndicators.indexOf(z) !== -1,
    );
    return i === -1 ? null : availableZones[i];
  };

  let devopsZones: Zone[] = null;
  let ocZone: Zone = null;

  const directives = zone.split(',');
  for (let i = 0; i < directives.length; i++) {
    const directive = directives[i];
    const eq = directive.indexOf('=');
    if (eq == -1) {
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

      devopsZones = key
        .substr(DEVOPS_ZONE_PREFIX.length)
        .split('-')
        .map((z) => findZone(z))
        ;
      if (!devopsZones) {
        throw Error(`${obj.metadata.name}: Invalid zone selector(missing zone name): ${zone}`)
      }

      const unknownZoneNames = devopsZones.filter((z) => z === null);
      if (unknownZoneNames) {
        throw Error(`${obj.metadata.name}: Invalid zone selector(unknown zone name): ${unknownZoneNames}`)
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
    if (zones == null) {
      return availableZones
        .filter((z) => z.enabled)
        .map((z) => z.displayName)
        .join(', ');
    }

    return zones.map((z) => z.displayName).join(', ');
  } catch (e) {
    /* eslint-disable no-console */
    console.error(`${e}`);
    return '<UNSCHEDULABLE(Invalid selector)>';
  }
}
