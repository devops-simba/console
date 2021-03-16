import * as _ from 'lodash';

import { Selector } from '@console/internal/module/k8s/types';

export function serializeCyclicObject(obj: any): string {
  var seen = [];

  return JSON.stringify(obj, function(key, val) {
     if (val != null && typeof val == "object") {
          if (seen.indexOf(val) >= 0) {
              return;
          }
          seen.push(val);
      }
      return val;
  })
}
export function isMatch(obj: {labels?: {[key: string]: string}}, selector: Selector): boolean {
  const labels = _.get(obj, 'labels', {});
  if (!_.isEmpty(selector.matchLabels)) {
    if (Object.keys(labels).length < Object.keys(selector.matchLabels).length) {
      return false;
    }

    // try to find the first label that does not match specified labels
    for (const key in selector.matchLabels) {
      const value = selector.matchLabels[key];
      const ovalue = _.get(labels, key, undefined);
      if (value !== ovalue) {
        return false;
      }
    }
  }
  if (!_.isEmpty(selector.matchExpressions)) {
    // find index of first item that does not match the expression
    const invalidIndex = selector.matchExpressions.findIndex(
      (expr) => {
        const ovalue = _.get(labels, expr.key, undefined);
        switch (expr.operator) {
          case 'In':
            return ovalue !== undefined && expr.values.includes(ovalue);
          case 'NotIn':
            return ovalue === undefined || expr.values.includes(ovalue);
          case 'Equals':
            return ovalue === expr.value;
          case 'NotEqual':
            return ovalue !== expr.value;
          case 'Exists':
            return ovalue !== undefined;
          case 'DoesNotExist':
            return ovalue === undefined;
        }
      }
    );
    if (invalidIndex !== -1) {
        return false;
      }
  }

  return true;
}
export function isEmptySelector(selector: Selector): boolean {
  if (!selector) {
    return true;
  }
  if (_.isEmpty(selector.matchLabels) && _.isEmpty(selector.matchExpressions)) {
    return true;
  }

  return false;
}
