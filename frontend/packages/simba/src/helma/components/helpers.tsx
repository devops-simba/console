import {
  referenceForModel,
  // k8sCreate,
} from '@console/internal/module/k8s';
import {
  Kebab,
} from '@console/internal/components/utils'

import {
  HelmaModel,
} from '../models'

export const cdnKind = referenceForModel(HelmaModel);
export const cdnMenuActions = [
  ...Kebab.getExtensionsActionsForKind(HelmaModel),
  ...Kebab.factory.common
];
