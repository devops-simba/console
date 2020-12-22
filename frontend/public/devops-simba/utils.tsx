import { Zone } from './types';
import { knownAnnotations } from './constants';
import { K8sResourceCommon } from '../module/k8s/types'

export function updateNodeSelector(
  model: K8sResourceCommon,
  selectedZones: Zone[],
) {
  const zoneNames = selectedZones.map((z) => z.name);
  if (!model.metadata.annotations) {
    model.metadata.annotations = {};
  }
  model.metadata.annotations[
    knownAnnotations.openshiftNodeSelector
  ] = `topology.kubernetes.io/zone=${zoneNames.join(',')}`;
}
