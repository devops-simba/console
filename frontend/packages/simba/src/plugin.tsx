import * as _ from 'lodash';
import {
  Plugin,
  KebabActions,
  HrefNavItem,
  ModelDefinition,
  ResourceNSNavItem,
  ResourceClusterNavItem,
  ResourceListPage,
  ResourceDetailsPage,
  Perspective,
  RoutePage,
  OverviewResourceTab,
  YAMLTemplate,
  OverviewTabSection,
  GuidedTour,
  ProjectDashboardInventoryItem,
} from '@console/plugin-sdk';
// import {
//   K8sResourceKind,
//   referenceForModel
// } from '@console/internal/module/k8s';

import * as helmaModels from './helma/models';
import { getHelmaStatusGroups } from './helma/utils';

import * as monitoringModels from './monitoring/models';
import { getMonitoringStatusGroup } from './monitoring/utils';

// import {
//   RouteModel
// } from '@console/internal/models'

type ConsumedExtensions =
  | ModelDefinition
  | HrefNavItem
  | ResourceClusterNavItem
  | ResourceNSNavItem
  | ResourceListPage
  | ResourceDetailsPage
  | Perspective
  | RoutePage
  | KebabActions
  | OverviewResourceTab
  | YAMLTemplate
  | OverviewTabSection
  | GuidedTour
  | ProjectDashboardInventoryItem
  ;

/* eslint-disable no-console */
console.info("SIMBA: Inside plugin");
const plugin: Plugin<ConsumedExtensions> = [
  // Models
  {
    type: 'ModelDefinition',
    properties: {
      models: [ helmaModels.HelmaModel, ]
    }
  },
  // Helma
  {
    type: 'Page/Resource/List',
    properties: {
      model: helmaModels.HelmaModel,
      loader: () =>
        import(
          './helma' /* webpackChunkName: "helma" */
        ).then((m) => m.CDNPage),
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: helmaModels.HelmaModel,
      loader: () =>
        import(
          './helma' /* webpackChunkName: "helma" */
        ).then((m) => m.CDNDetailsPage),
    }
  },
  {
    type: 'Page/Route',
    properties: {
      path: ['/k8s/ns/:ns/cdns/~new/form', '/k8s/ns/:ns/devops.snapp.ir~v1~CDN/~new/form'],
      exact: true,
      loader: async () =>
        (
          await import(
          './helma' /* webpackChunkName: "helma" */
          )
        ).CDNEditor
    }
  },
  {
    type: "Project/Dashboard/Inventory/Item",
    properties: {
      useAbbr: true,
      model: helmaModels.HelmaModel,
      mapper: getHelmaStatusGroups,
    }
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      //id: 'helmacdns',
      perspective: 'admin',
      section: 'Networking',
      componentProps: {
        name: 'CDN and WAF',
        model: helmaModels.HelmaModel,
        //resource: referenceForModel(helmaModels.HelmaModel)
        resource: 'cdns'
      }
    }
  },
  // ServiceMonitor
  // {
  //   type: 'Page/Resource/List',
  //   properties: {
  //     model: monitoringModels.ServiceMonitorModel,
  //     loader: () =>
  //     import(
  //         './monitoring' /* webpackChunkName: "simbaMonitoring" */
  //       ).then((m) => m.ServiceMonitorListPage),
  //     },
  // },
  // {
  //   type: 'Page/Resource/Details',
  //   properties: {
  //     model: monitoringModels.ServiceMonitorModel,
  //     loader: () =>
  //       import(
  //         './monitoring' /* webpackChunkName: "simbaMonitoring" */
  //       ).then((m) => m.ServiceMonitorDetailsPage)
  //   }
  // },
  {
    type: 'Page/Route',
    properties: {
      path: ['/k8s/ns/:ns/servicemonitors/~new/form', '/k8s/ns/:ns/monitoring.coreos.com~v1~ServiceMonitor/~new/form'],
      exact: true,
      loader: async () =>
        (
          await import(
            './monitoring' /* webpackChunkName: "simbaMonitoring" */
          )
        ).ServiceMonitorCreator
    }
  },
  {
    type: "Project/Dashboard/Inventory/Item",
    properties: {
      //useAbbr: true,
      model: monitoringModels.ServiceMonitorModel,
      mapper: getMonitoringStatusGroup,
    }
  },
  // Updated components
  // {
  //   type: 'Page/Route',
  //   properties: {
  //     path: '/k8s/ns/:ns/routes/~new/form',
  //     exact: true,
  //     loader: async () =>
  //       (
  //         await import(
  //           './updated_components/routes/create-route' /* webpackChunkName: "simba-create-route" */
  //         )
  //       ).CreateRoute,
  //   },
  // },
];

export default plugin;
