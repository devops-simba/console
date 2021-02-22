import { K8sResourceKind } from '@console/internal/module/k8s'
import { InventoryStatusGroup } from '@console/shared/src/components/dashboard/inventory-card/status-group'
import { getStatusGroups } from '@console/shared/src/components/dashboard/inventory-card/utils'
import { StatusGroupMapper } from '@console/shared/src/components/dashboard/inventory-card/InventoryItem'

import { HelmaKind } from './models'

const CDN_PHASE_GROUP_MAPPING = {
  [InventoryStatusGroup.UNKNOWN]: ['New'],
  [InventoryStatusGroup.NOT_MAPPED]: ['Ready'],
  //[InventoryStatusGroup.ERROR]: [],
  [InventoryStatusGroup.PROGRESS]: [
    'DnsConfiguring',
    'ClusterConfiguring',
    'PageRulesConfiguring',
    'WAFConfiguring',
    'TLSConfiguring',
  ],
};

export const cdnPhase = (cdn: HelmaKind): string => {
  if (!cdn || !cdn.status) {
    return 'New'
  }

  return cdn.status.phase;
};
export const cdnResourcePhase = (cdn: K8sResourceKind): string => {
  if (!cdn?.status?.phase) {
    return 'New'
  }

  return cdn.status.phase;
};

export const getHelmaStatusGroups: StatusGroupMapper = (resources) => {
  return getStatusGroups(resources, CDN_PHASE_GROUP_MAPPING, cdnPhase, 'cdn-status')
};
