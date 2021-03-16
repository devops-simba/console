import * as React from 'react'
import { sortable } from '@patternfly/react-table';

import {
  Table,
  TableProps,
  TableRow,
  TableData,
  RowFunction,
  ListPage,
} from '@console/internal/components/factory';
import {
  Kebab,
  ResourceKebab,
  //ResourceIcon,
  //ExternalLink,
} from '@console/internal/components/utils'

import {
  //ServiceMonitorModel,
  ServiceMonitorKind,
} from '../models'
import {
  serviceMonitorKind,
  serviceMonitorMenuActions,
} from './helpers'

const tableColumnClasses = [
  '', // name of the ServiceMonitor
  '', // endpoints of the ServiceMonitor
];
const tableColumnHeaders = () => [
  {
    title: 'Name',
    sortField: 'metadata.name',
    transforms: [sortable],
  },
  {
    title: 'Endpoints',
  }
];

const servicemonitorTableRow: RowFunction<ServiceMonitorKind> = ({obj, index, key, style}) => {
  const { metadata: {name}, spec: {endpoints} } = obj;
  return <TableRow id={`servicemonitor-${key}`} trKey={key} index={index} style={style}>
    <TableData className={tableColumnClasses[0]}>{name}</TableData>
    <TableData className={tableColumnClasses[1]}>{endpoints.length} Endpoints</TableData>
    <TableData className={Kebab.columnClass}>
      <ResourceKebab
        actions={serviceMonitorMenuActions}
        kind={serviceMonitorKind}
        resource={obj} />
    </TableData>
  </TableRow>
};

export const ServiceMonitorList: React.FC<TableProps> = (props) => (
  <Table
    {...props}
    Row={servicemonitorTableRow}
    aria-label='ServiceMonitors'
    Header={tableColumnHeaders}
    virtualize
    />
);

export type ServiceMonitorListPageProps = {
  obj: ServiceMonitorKind;
  namespace: string;
};
export const ServiceMonitorListPage: React.FC<ServiceMonitorListPageProps> = (props) => {
  const createProps = {
    to: `/k8s/ns/${props.namespace || 'default'}/servicemonitors/~new/form`
  };

  return <ListPage
    {...props}
    canCreate={true}
    createProps={createProps}
    kind={serviceMonitorKind}
    rowFilters={[]}
    ListComponent={ServiceMonitorList}
  />
};
