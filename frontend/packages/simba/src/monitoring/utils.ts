import {
  InventoryStatusGroup
} from '@console/shared/src/components/dashboard/inventory-card/status-group'
import {
  getStatusGroups,
} from '@console/shared/src/components/dashboard/inventory-card/utils'
import {
  StatusGroupMapper
} from '@console/shared/src/components/dashboard/inventory-card/InventoryItem'

const SERVICEMONITOR_GROUP_MAPPINGS = {
  [InventoryStatusGroup.NOT_MAPPED]: ['Ready'],
};
export const getMonitoringStatusGroup: StatusGroupMapper = (resources) => {
  return getStatusGroups(
    resources,
    SERVICEMONITOR_GROUP_MAPPINGS,
    () => 'Ready',
    'servicemonitor-status');
};
