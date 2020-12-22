import * as React from 'react';
import { Checkbox } from '@patternfly/react-core';

import { Zone } from '../types';

export class ZoneCheckbox extends React.Component<ZoneCheckboxProps, ZoneCheckboxState> {
  _debugBackend() {
    const backend = this.props.backend;
    return backend.map((z) => z.name).join(', ');
  }
  _handleChange(checked: boolean, e: React.FormEvent<HTMLInputElement>) {
    const { backend, zone, onChange } = this.props;
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
    this.setState({ checked });
    onChange && onChange(checked, e);
  }
  render() {
    const { zone } = this.props;
    const { checked } = this.state;

    /* eslint-disable no-console */
    console.log(`zone: ${zone.name}, checked: ${checked}, backend: [${this._debugBackend()}]`);
    return (
      <Checkbox
        id={`cb-zone-${zone.name}`}
        isDisabled={!zone.enabled}
        isChecked={checked}
        onChange={this._handleChange.bind(this)}
      />
    );
  }
}
export class ZoneCheckboxProps {
  zone: Zone;
  backend: Zone[];
  onChange?: (checked: boolean, event: React.FormEvent<HTMLInputElement>) => void;
}
export class ZoneCheckboxState {
  checked: boolean;
}

// export function createZoneCheckbox(zone: Zone, backend: Zone[]) {
//   function handleChange(checked: boolean) {
//     if (checked) {
//       if (!backend.includes(zone)) {
//         backend.push(zone);
//       }
//     } else {
//       const index = backend.indexOf(zone);
//       if (index !== -1) {
//         backend.splice(index, 1);
//       }
//     }
//   }
//   return (
//     <>
//       <Checkbox
//         id={`cb-zone-${zone.name}`}
//         isDisabled={!zone.enabled}
//         isChecked={backend.includes(zone)}
//         onChange={(checked, e) => handleChange(checked, e)}
//       />
//     </>
//   );
// }
