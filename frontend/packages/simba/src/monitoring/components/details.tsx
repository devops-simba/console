import * as React from 'react'

import {
  SectionHeading,
  ResourceSummary,
  DetailsItem,
  detailsPage,
  navFactory,
} from '@console/internal/components/utils'
import {
  DetailsPage,
} from '@console/internal/components/factory'

import { ServiceMonitorKind } from '../models'
import { serviceMonitorMenuActions, serviceMonitorKind } from './helpers'

export type ServiceMonitorDetailsPageProps = {
  obj: ServiceMonitorKind;
};

const serviceMonitorDetails: React.FC<ServiceMonitorDetailsPageProps> = ({obj}) => {
  return <>
    <div className="co-m-pane__body">
      <SectionHeading text="ServiceMonitor Details" />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={obj}>
            <DetailsItem label="#Endpoints" obj={obj} path='' description='Number of endpoints'>
              {obj.spec.endpoints.length}
            </DetailsItem>
          </ResourceSummary>
        </div>
      </div>
    </div>
  </>
}

export const ServiceMonitorDetailsPage: React.FC<{match: any}> = (props) => (
  <DetailsPage
    {...props}
    kind={serviceMonitorKind}
    menuActions={serviceMonitorMenuActions}
    pages={[navFactory.details(detailsPage(serviceMonitorDetails)), navFactory.editYaml()]}
  />
);
