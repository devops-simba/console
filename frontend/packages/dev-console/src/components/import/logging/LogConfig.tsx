import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { CheckboxField, InputField, NumberSpinnerField, TextColumnField } from '@console/shared';

export const LogConfigCheckbox: React.FC = () => {
  const {
    values: {
      logConfig
    }
  } = useFormikContext<FormikValues>();
  return <>
    <CheckboxField
      name="logConfig.enabled"
      label="Enable Logging"
      formLabel="Logging"
      helpText="Enable log shipping for your deployment"
    />
    {logConfig.enabled && (
      <>
        <InputField
          name="logConfig.logName"
          label="Log Name"
          helpText="Name of the index in Elastic search"
          placeholder="ic-openshift-namespace-logname-%dateTime%"
          required
        />
        <NumberSpinnerField
          label="ILM"
          name="logConfig.ilm"
          helpText="Number of days that log should retained in elastic search. 0 means default value" />
        <TextColumnField
          label="Users"
          name="logConfig.users"
          helpText="List of users that may see logs in Kibana"
        />
      </>
    )}
  </>
}
