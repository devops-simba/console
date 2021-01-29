import { Zone } from './types';
import { knownAnnotations, availableZones } from './constants';
import { K8sResourceCommon } from '../module/k8s/types';

export function updateNodeSelector(model: K8sResourceCommon, selectedZones: Zone[]) {
  const enabledZones = availableZones.filter((z) => z.enabled);
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
  const index = availableZones.findIndex((z) => z.zoneIndicator === zoneIndicator);
  if (index === -1) {
    return null;
  }
  return availableZones[index];
}
