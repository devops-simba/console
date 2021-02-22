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

import { HelmaKind, } from '../models'
import { cdnResourcePhase, } from '../utils'
import { cdnMenuActions, cdnKind } from './helpers'

export type CDNDetailsPageProps = {
  obj: HelmaKind;
};

const cdnDetails: React.FC<CDNDetailsPageProps> = ({obj: cdn}) => {
  return <>
    <div className="co-m-pane__body">
      <SectionHeading text="CDN Details" />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={cdn}>
            <DetailsItem label="Domain" obj={cdn} path="status.domain" />
          </ResourceSummary>
        </div>
      </div>
    </div>
  </>
}

export const CDNDetailsPage: React.FC<{match: any}> = (props) => (
  <DetailsPage
    {...props}
    getResourceStatus={cdnResourcePhase}
    kind={cdnKind}
    menuActions={cdnMenuActions}
    pages={[navFactory.details(detailsPage(cdnDetails)), navFactory.editYaml()]}
  />
)
