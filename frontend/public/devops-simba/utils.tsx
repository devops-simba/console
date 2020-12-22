import { Zone } from './types';
import * as React from 'react';
import { knownAnnotations } from './constants';
import { Checkbox } from '@patternfly/react-core';

export function updateNodeSelector(
  model: { annotations: { [x: string]: string } },
  selectedZones: Zone[],
) {
  const zoneNames = selectedZones.map((z) => z.name);
  model.annotations[
    knownAnnotations.openshiftNodeSelector
  ] = `topology.kubernetes.io/zone${zoneNames.join(',')}`;
}

export function createZoneCheckbox(zone: Zone, backend: Zone[]) {
  function handleChange(checked: boolean) {
    if (checked) {
      if (!backend.includes(zone)) {
        backend.push(zone);
      }
    } else {
      const index = backend.indexOf(zone);
      if (index !== -1) {
        backend.splice(index, 1);
      }
    }
  }
  return (
    <>
      <Checkbox
        id={`cb-zone-${zone.name}`}
        isDisabled={!zone.enabled}
        isChecked={backend.includes(zone)}
        onChange={(checked, e) => handleChange(checked, e)}
      />
    </>
  );
}
