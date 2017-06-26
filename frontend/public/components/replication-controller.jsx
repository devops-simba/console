import React from 'react';

import { ResourceEventStream } from './events';
import { DetailsPage, List, ListPage, WorkloadListHeader, WorkloadListRow } from './factory';
import { replicaSetMenuActions } from './replicaset';
import { navFactory, Heading, ResourceSummary, ResourcePodCount } from './utils';

const Details = (replicationController) => <div>
  <Heading text="Replication Controller Overview" />
  <div className="co-m-pane__body-group">
    <div className="co-m-pane__body-section--bordered">
      <div className="row no-gutter">
        <div className="col-md-6">
          <ResourceSummary resource={replicationController} />
        </div>
        <div className="col-md-6">
          <ResourcePodCount resource={replicationController} />
        </div>
      </div>
    </div>
  </div>
</div>;

const {details, editYaml, pods, events} = navFactory;

export const ReplicationControllersDetailsPage = props => <DetailsPage
  {...props}
  menuActions={replicaSetMenuActions}
  pages={[details(Details), editYaml(), pods(), events(ResourceEventStream)]}
/>;

const Row = props => <WorkloadListRow {...props} kind="replicationcontroller" actions={replicaSetMenuActions} />;
export const ReplicationControllersList = props => <List {...props} Header={WorkloadListHeader} Row={Row} />;
export const ReplicationControllersPage = props => <ListPage canCreate={true} ListComponent={ReplicationControllersList} {...props} />;
