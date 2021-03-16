import {
  Kebab
} from '@console/internal/components/utils'
import {
  referenceForModel,
} from '@console/internal/module/k8s';

import {
  ServiceMonitorModel,
} from '../models'

export const serviceMonitorKind = referenceForModel(ServiceMonitorModel);

export const serviceMonitorMenuActions = [
  ...Kebab.getExtensionsActionsForKind(ServiceMonitorModel),
  ...Kebab.factory.common,
];
