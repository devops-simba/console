import * as React from 'react';
import { Checkbox } from '@patternfly/react-core';

export interface CheckboxItem {
  getId: () => string;
  getEnabled: () => boolean;
  getDisplayName: () => string;
}

/* eslint-disable no-console */
export class ItemCheckbox extends React.Component<ItemCheckboxProps, ItemCheckboxState> {
  constructor(props: ItemCheckboxProps) {
    super(props);
    this.state = {
      checked: this.props.backend.includes(this.props.item),
    };
  }

  _debugBackend() {
    const backend = this.props.backend;
    return backend.map((i) => `'${i.getId()}: ${i.getDisplayName()}`).join(', ');
  }
  /* eslint-disable @typescript-eslint/no-unused-vars */
  /* eslint-disable no-unused-vars */
  _debug(message?: string) {
    /*
    let log = `backend: [${this._debugBackend()}], item: '${this.props.item.getId()}: ${this.props.item.getDisplayName()}'`;
    if (message) {
      log = `${message} => ${log}`;
    }
    console.log(log);
    //*/
  }
  _handleChange(checked: boolean, e: React.FormEvent<HTMLInputElement>) {
    const { backend, item, onChange } = this.props;
    this._debug(`status changed(checked=${checked})`);
    if (checked) {
      if (!backend.includes(item)) {
        backend.push(item);
      }
    } else {
      const index = backend.indexOf(item);
      if (index !== -1) {
        backend.splice(index, 1);
      }
    }
    this._debug(`status updated(checked=${checked})`);
    this.setState({ checked });
    onChange && onChange(checked, e);
  }
  render() {
    const { item } = this.props;
    const { checked } = this.state;

    this._debug('rendring');
    return (
      <Checkbox
        id={`cb-item-${item.getId()}`}
        name={`cb-item-${item.getId()}`}
        isDisabled={!item.getEnabled()}
        isChecked={checked}
        label={item.getDisplayName()}
        onChange={this._handleChange.bind(this)}
      />
    );
  }
}
export class ItemCheckboxProps {
  item: CheckboxItem;
  backend: CheckboxItem[];
  onChange?: (checked: boolean, event: React.FormEvent<HTMLInputElement>) => void;
}
export class ItemCheckboxState {
  checked: boolean;
}

/* eslint-disable react/jsx-key */
export const CheckboxGroup: React.FC<CheckboxGroupProps> = (props) => {
  return (
    <>
      {props.availableItems.map((i) => (
        <ItemCheckbox backend={props.selectedItems} item={i} />
      ))}
    </>
  );
};
export class CheckboxGroupProps {
  selectedItems: CheckboxItem[];
  availableItems: CheckboxItem[];
}
