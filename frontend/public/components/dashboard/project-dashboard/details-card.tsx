import * as _ from 'lodash';
import * as React from 'react';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardLink from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import DetailItem from '@console/shared/src/components/dashboard/details-card/DetailItem';
import { getName, getRequester, GreenCheckCircleIcon } from '@console/shared';
import { LabelList, resourcePathFromModel } from '../../utils';
import { ProjectModel } from '../../../models';
import { ProjectDashboardContext } from './project-dashboard-context';
import { K8sResourceKind } from '../../../module/k8s';
import { availableZones } from '../../../devops-simba/constants';

const DEVOPS_ZONE_PREFIX = 'zones.devops.snapp.ir/';
const DEVOPS_ZONE_VALUE = 'true';
function getZone(obj: K8sResourceKind) {
  const zone = _.get(obj?.metadata?.annotations, 'openshift.io/node-selector');
  if (!zone) {
    return null;
  }
  const directives = zone.split(',');
  const findZone = (z: string) => {
    const i = availableZones.findIndex(
      (az) => az.zoneIndicator === z || az.alternateIndicators.indexOf(z) !== -1,
    );
    return i === -1 ? `UNKNOWN[${z}]` : availableZones[i].displayName;
  };
  for (let i = 0; i < directives.length; i++) {
    const directive = directives[i];
    const eq = directive.indexOf('=');
    const key = directive.substring(0, eq);
    const value = directive.substr(eq + 1);
    if (key.startsWith(DEVOPS_ZONE_PREFIX) && value === DEVOPS_ZONE_VALUE) {
      return key
        .substr(DEVOPS_ZONE_PREFIX.length)
        .split('-')
        .map((z) => findZone(z))
        .filter((z) => z) // not empty or null
        .join(', ');
    } else if (value && key === 'zone') {
      return findZone(value);
    }
  }
  return null;
}

export const DetailsCard: React.FC = () => {
  const { obj } = React.useContext(ProjectDashboardContext);
  const keys = _.keys(obj.metadata.labels).sort();
  const labelsSubset = _.take(keys, 3);
  const firstThreelabels = _.pick(obj.metadata.labels, labelsSubset);
  const detailsLink = `${resourcePathFromModel(ProjectModel, obj.metadata.name)}/details`;
  const serviceMeshEnabled = obj.metadata?.labels?.['maistra.io/member-of'];
  return (
    <DashboardCard data-test-id="details-card">
      <DashboardCardHeader>
        <DashboardCardTitle>Details</DashboardCardTitle>
        <DashboardCardLink to={detailsLink}>View all</DashboardCardLink>
      </DashboardCardHeader>
      <DashboardCardBody>
        <DetailsBody>
          <DetailItem isLoading={!obj} title="Name">
            {getName(obj)}
          </DetailItem>
          <DetailItem isLoading={!obj} title="Requester">
            {getRequester(obj) || <span className="text-muted">No requester</span>}
          </DetailItem>
          <DetailItem isLoading={!obj} title="Zone">
            {getZone(obj) || <span className="text-muted">Any</span>}
          </DetailItem>
          <DetailItem isLoading={!obj} title="Labels">
            <div className="co-project-dashboard__details-labels">
              <LabelList kind={ProjectModel.kind} labels={firstThreelabels} />
              {keys.length > 3 && <DashboardCardLink to={detailsLink}>View all</DashboardCardLink>}
            </div>
          </DetailItem>
          {serviceMeshEnabled && (
            <DetailItem isLoading={!obj} title="Service Mesh">
              <GreenCheckCircleIcon /> Service Mesh Enabled
            </DetailItem>
          )}
        </DetailsBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};
