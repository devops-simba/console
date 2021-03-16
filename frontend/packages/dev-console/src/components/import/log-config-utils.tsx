import {
  LogConfigurationData,
} from './import-types';

export function getLogConfigAnnotations(logConfig: LogConfigurationData): { [key: string]: string } {
  const result: { [key: string]: string } = {};
  if (logConfig.enabled) {
    result['log_with_fluent'] = "yes";
    result['log_name'] = logConfig.logName;
    result['ILM'] = logConfig.ilm.toString();
    for (let i = 0; i < logConfig.users.length; i++) {
      result[`user_${i+1}`] = logConfig.users[i];
    }
  }
  return result;
};
