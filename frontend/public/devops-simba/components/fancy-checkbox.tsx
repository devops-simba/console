import * as React from 'react';
import classNames from 'classnames';
import { ToggleOnIcon, ToggleOffIcon } from '@patternfly/react-icons';

export class FancyCheckbox extends React.Component<FancyCheckboxProps, FancyCheckboxState> {
  constructor(props) {
    super(props);
    this.setState({
      checked: this.props.isChecked,
      checkedImage: this.props.checkedImage || <ToggleOnIcon />,
      uncheckedImage: this.props.uncheckedImage || <ToggleOffIcon />,
    });
  }

  _handleChange() {
    const { checked } = this.state;
    this.setState({ checked: !checked });
    this.props.onChange && this.props.onChange(checked);
  }
  render() {
    const { label } = this.props;
    const { checked, checkedImage, uncheckedImage } = this.state;
    const icon = checked ? checkedImage : uncheckedImage;
    const handleChange = this._handleChange.bind(this);
    return (
      <div className="fancy-checkbox">
        {React.cloneElement(icon, {
          className: classNames(icon.props.classNames, 'checkbox', checked ? 'checked' : ''),
          onClick: handleChange,
        })}
        {label && <span onClick={handleChange}>{label}</span>}
      </div>
    );
  }
}
export interface FancyCheckboxProps
  extends Omit<React.HTMLProps<HTMLInputElement>, 'type' | 'onChange' | 'disabled' | 'label'> {
  /** Additional classes added to the Checkbox. */
  className?: string;
  /** Flag to show if the Checkbox selection is valid or invalid. */
  isValid?: boolean;
  /** Flag to show if the Checkbox is disabled. */
  isDisabled?: boolean;
  /** Flag to show if the Checkbox is checked. */
  isChecked?: boolean;
  /** A callback for when the Checkbox selection changes. */
  onChange?: (checked: boolean) => void;
  /** Label text of the checkbox. */
  label?: string;
  /** Id of the checkbox. */
  id: string;
  /** Aria-label of the checkbox. */
  'aria-label'?: string;
  /** Description text of the checkbox. */
  description?: React.ReactNode;
  /** Image that will be used when checkbox is checked. */
  checkedImage?: React.ReactElement;
  /** Image that will be used when checkbox is unchecked. */
  uncheckedImage?: React.ReactElement;
}
export class FancyCheckboxState {
  checked: boolean;
  checkedImage: React.ReactElement;
  uncheckedImage: React.ReactElement;
}
