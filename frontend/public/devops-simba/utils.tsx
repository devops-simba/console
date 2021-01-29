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
