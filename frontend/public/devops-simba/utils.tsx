import { Zone } from './types';
import * as React from 'react';
import { knownAnnotations } from './constants';
import { Checkbox } from '@patternfly/react-core';

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
  ] = `topology.kubernetes.io/zone${zoneNames.join(',')}`;
}

export function createZoneCheckbox(zone: Zone, backend: Zone[]) {
  function backendToString() {
    return '[' + backend.map(z => z.name).join(', ') + ']'
  }
  function handleChange(checked: boolean) {
    console.log(`zone(${zone.name}), checked: ${checked}, backend: ${backendToString()}`);
    if (checked) {
      if (!backend.includes(zone)) {
        backend.push(zone);
      }
    } else {
      const index = backend.indexOf(zone);
      if (index !== -1) {
        backend.splice(index, 1);
        console.log(`'${zone.name}' removed from ${backendToString()}`);
      } else {
        console.log(`Failed to find '${zone.name}' in ${backendToString()}`);
      }
    }
  }
  return (
    <>
      <Checkbox
        id={`cb-zone-${zone.name}`}
        name={`cb-zone-${zone.name}`}
        label={zone.displayName + ': ' + backendToString()}
        isDisabled={!zone.enabled}
        isChecked={backend.includes(zone)}
        onChange={(checked) => handleChange(checked)}
      />
    </>
  );
}
