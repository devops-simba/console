import { Zone } from './types';
import { knownAnnotations } from './constants';

export function updateNodeSelector(
  model: { annotations: { [x: string]: string } },
  selectedZones: Zone[],
) {
  const zoneNames = selectedZones.map((z) => z.name);
  if (!model.annotations) {
    model.annotations = {};
  }
  model.annotations[
    knownAnnotations.openshiftNodeSelector
  ] = `topology.kubernetes.io/zone=${zoneNames.join(',')}`;
}
