import * as React from 'react'
import { Link } from 'react-router-dom';
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
  ResourceIcon,
  ResourceKebab,
  ExternalLink,
} from '@console/internal/components/utils'

import { cdnPhase, } from '../utils'
import { HelmaKind, } from '../models'
import { cdnKind, cdnMenuActions } from './helpers'

const tableColumnClasses = [
  '', // name of the CDN
  '', // domain of the CDN
  '', // status of the domain
];

const cdnTableHeaders = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
    },
    {
      title: 'Domain',
      sortField: 'status.domain',
      transforms: [sortable],
    },
    {
      title: 'Status',
      sortFunc: 'cdnPhase',
      transforms: [sortable],
    }
  ];
};
const cdnTableRow: RowFunction<HelmaKind> = ({obj: cdn, index, key, style}) => {
  const domain = cdn.status?.domain;
  const status = cdnPhase(cdn);
  return <TableRow id={`cdn-${key}`} index={index} trKey={key} style={style}>
    <TableData className={tableColumnClasses[0]}>
      <span>
        <Link
          className="co-resource-item__resource-name"
          to={`/k8s/ns/${cdn.metadata.namespace}/cdns/${cdn.metadata.name}`}
          title={cdn.metadata.name}
          data-test-id={cdn.metadata.name}>
          <ResourceIcon kind={`${cdnKind}`} />
          <span>{cdn.metadata.name}</span>
        </Link>
      </span>
    </TableData>
    <TableData className={tableColumnClasses[1]}>
      {domain && (
        <ExternalLink
          href={`https://${domain}`}
          text={`https://${domain}`}
          />)}
    </TableData>
    <TableData className={tableColumnClasses[2]}>
      <span>{status}</span>
    </TableData>
    <TableData className={Kebab.columnClass}>
      <ResourceKebab actions={cdnMenuActions} kind={cdnKind} resource={cdn} />
    </TableData>
  </TableRow>
};
export const CDNList: React.FC<TableProps> = (props) => (
  <Table
    {...props}
    Row={cdnTableRow}
    aria-label="CDNs"
    customSorts={{cdnPhase}}
    Header={cdnTableHeaders}
    virtualize />
);

const filters = [
  {
    filterGroupName: "Status",
    type: 'cdn-status',
    reducer: cdnPhase,
    items: [
      { id: 'New', title: 'New' },
      { id: 'Ready', title: 'Ready' },
      { id: 'DnsConfiguring', title: 'DnsConfiguring' },
      { id: 'ClusterConfiguring', title: 'ClusterConfiguring' },
      { id: 'PageRulesConfiguring', title: 'PageRulesConfiguring' },
      { id: 'WAFConfiguring', title: 'WAFConfiguring' },
      { id: 'TLSConfiguring', title: 'TLSConfiguring' },
    ],
  },
];

export type CDNPageProps = {
  obj: HelmaKind;
  namespace: string;
};
export const CDNPage: React.FC<CDNPageProps> = (props) => {
  const createProps = {
    to: `/k8s/ns/${props.namespace || 'default'}/cdns/~new/form`,
  };
  return <ListPage
    {...props}
    canCreate={true}
    createProps={createProps}
    rowFilters={filters}
    kind={cdnKind}
    ListComponent={CDNList}
  />
};
