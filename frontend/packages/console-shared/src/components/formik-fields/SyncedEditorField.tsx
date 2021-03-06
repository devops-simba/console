import * as React from 'react';
import * as _ from 'lodash';
import { useField, useFormikContext, FormikValues } from 'formik';
import { Alert, Button, AlertActionCloseButton } from '@patternfly/react-core';
import { EditorType } from '../synced-editor/editor-toggle';
import RadioGroupField from './RadioGroupField';

import './SyncedEditorField.scss';
import { safeYAMLToJS, safeJSToYAML } from '../../utils/yaml';

type EditorContext = {
  name: string;
  editor: React.ReactNode;
  isDisabled?: boolean;
  sanitizeTo?: (preFormData: any) => any;
};

type SyncedEditorFieldProps = {
  name: string;
  formContext: EditorContext;
  yamlContext: EditorContext;
};

const SyncedEditorField: React.FC<SyncedEditorFieldProps> = ({
  name,
  formContext,
  yamlContext,
}) => {
  const [field] = useField(name);
  const { values, setFieldValue } = useFormikContext<FormikValues>();

  const formData = _.get(values, formContext.name);
  const yamlData = _.get(values, yamlContext.name);

  const [yamlWarning, setYAMLWarning] = React.useState<boolean>(false);
  const [disabledFormAlert, setDisabledFormAlert] = React.useState<boolean>(formContext.isDisabled);

  const changeEditorType = (newType: EditorType): void => {
    setFieldValue(name, newType);
  };

  const handleToggleToForm = () => {
    const newFormData = safeYAMLToJS(yamlData);
    if (!_.isEmpty(newFormData)) {
      changeEditorType(EditorType.Form);
      setFieldValue(
        formContext.name,
        formContext.sanitizeTo ? formContext.sanitizeTo(newFormData) : newFormData,
      );
    } else {
      setYAMLWarning(true);
    }
  };

  const handleToggleToYAML = () => {
    const newYAML = safeJSToYAML(formData, yamlData, { skipInvalid: true });
    setFieldValue(
      yamlContext.name,
      yamlContext.sanitizeTo ? formContext.sanitizeTo(newYAML) : newYAML,
    );
    changeEditorType(EditorType.YAML);
  };

  const onClickYAMLWarningConfirm = () => {
    setYAMLWarning(false);
    changeEditorType(EditorType.Form);
  };

  const onClickYAMLWarningCancel = () => {
    setYAMLWarning(false);
  };

  const onChangeType = (newType: EditorType) => {
    switch (newType) {
      case EditorType.YAML:
        handleToggleToYAML();
        break;
      case EditorType.Form:
        handleToggleToForm();
        break;
      default:
        break;
    }
  };

  React.useEffect(() => {
    setDisabledFormAlert(formContext.isDisabled);
  }, [formContext.isDisabled]);

  return (
    <>
      <div className="ocs-synced-editor-field__editor-toggle">
        <RadioGroupField
          label="Configure via:"
          name={name}
          options={[
            {
              label: 'Form View',
              value: EditorType.Form,
              isDisabled: formContext.isDisabled,
            },
            {
              label: 'YAML View',
              value: EditorType.YAML,
              isDisabled: yamlContext.isDisabled,
            },
          ]}
          onChange={(val: string) => onChangeType(val as EditorType)}
          isInline
        />
      </div>
      {yamlWarning && (
        <Alert
          className="co-synced-editor__yaml-warning"
          variant="danger"
          isInline
          title="Invalid YAML cannot be persisted"
        >
          <p>Switching to Form View will delete any invalid YAML.</p>
          <Button variant="danger" onClick={onClickYAMLWarningConfirm}>
            Switch and Delete
          </Button>
          &nbsp;
          <Button variant="secondary" onClick={onClickYAMLWarningCancel}>
            Cancel
          </Button>
        </Alert>
      )}
      {disabledFormAlert && (
        <Alert
          variant="default"
          title="Form view is disabled for this chart because the schema is not available"
          actionClose={<AlertActionCloseButton onClose={() => setDisabledFormAlert(false)} />}
          isInline
        />
      )}
      {field.value === EditorType.Form ? formContext.editor : yamlContext.editor}
    </>
  );
};

export default SyncedEditorField;
