import * as _ from 'lodash';
import * as React from 'react';
//import * as cx from 'classnames';
import * as TagsInput from 'react-tagsinput';
import { Button } from '@patternfly/react-core'
import { CloseIcon } from '@patternfly/react-icons'

import {
  K8sKind,
  K8sResourceKind,
  MatchExpression,
  Selector,
  // k8sCreate,
} from '@console/internal/module/k8s';
import {
  Table,
  //TableProps,
  TableRow,
  TableData,
  RowFunction,
} from '@console/internal/components/factory';
import {
  Dropdown,
  ResourceIcon,
} from '@console/internal/components/utils';

import {
  isMatch
} from '../utils';

import {
  KeyValueEditor
} from './key-value'
import './_components.scss';

type ExpressionOp = 'Exists' | 'DoesNotExist' | 'In' | 'NotIn' | 'Equals' | 'NotEqual';

export function createExpressionList(selector: Selector): MatchExpression[] {
  const labels = Object.keys(selector.matchLabels||{} as any).map((k) => ({
    key: k as string,
    operator: 'Equals' as any,
    value: selector.matchLabels[k],
  }));
  return [
    ...labels,
    ...(selector.matchExpressions||[]),
  ];
}
export function createSelector(expressions: MatchExpression[]): Selector {
  return expressions.reduce(
    (acc, expr) => {
      const result = {...acc};
      if (expr.operator == 'Equals') {
        if (!result.matchLabels) {
          result.matchLabels = {};
        } else {
          result.matchLabels = {...acc.matchLabels};
        }
        result.matchLabels[expr.key] = expr.value;
      } else {
        if (!result.matchExpressions) {
          result.matchExpressions = [];
        } else {
          result.matchExpressions = [...acc.matchExpressions];
        }
        result.matchExpressions.push(expr);
      }
      return result;
    },
    {
    } as Selector
  )
}

// type objectListProps = {
//   kind: string;
//   objects: K8sResourceKind[];
// };

type objectsRowProps = {
  kind: string;
  obj: K8sResourceKind;
  selected: boolean;
  mayAddKeyValue: (key: string, value: string) => boolean;
  addKeyValue: (key: string, value: string) => void;
};
const unselectedObjectsCC = [
  '',
  '',
];
const objectListHeaders = () => [
  {
    title: 'Object',
    props: {className: unselectedObjectsCC[0]},
  },
  {
    title: 'Labels',
    props: {className: unselectedObjectsCC[1]},
  },
];
const objectListRow: RowFunction<objectsRowProps> =
  ({obj: {kind, obj, mayAddKeyValue, addKeyValue, selected}, key, index, style}) => {
    /* eslint-disable no-console */
    const labels = obj.metadata?.labels || {};
    const keyValues = Object.keys(labels).map((k) => ({key: k, value: labels[k]}))
    console.info(`DBG.objectListRow(${kind}: ${JSON.stringify(labels)}) => ${JSON.stringify(keyValues)}`)
    return <TableRow
      id={`svc-${key}`}
      className={selected ? 'selected-object' : 'unselected-object'}
      index={index}
      trKey={key}
      style={style}>
      <TableData className={unselectedObjectsCC[0]}>
        <ResourceIcon kind={kind} />
        &nbsp;
        {obj.metadata?.name}
      </TableData>
      <TableData className={unselectedObjectsCC[1]}>
        <KeyValueEditor
          pairs={keyValues}
          clickable={(index) => mayAddKeyValue(keyValues[index].key, keyValues[index].value)}
          onItemClick={(index) => addKeyValue(keyValues[index].key, keyValues[index].value)}
          />
      </TableData>
    </TableRow>
  };

type expressionProps = {
  expr: MatchExpression;
  isNew: boolean;
};
const expressionTableColumnsClasses = [
  '',
  '',
  '',
  'pf-c-table__action',
];
const operatorOptions = {
  'Exists': 'Exists',
  'DoesNotExist': 'DoesNotExist',
  'In': 'In',
  'NotIn': 'NotIn',
  'Equals': 'Equals',
  'NotEqual': 'NotEqual',
};
const expressionTableColumnsHeaders = () => [
  {
    title: 'Key',
    props: {className: expressionTableColumnsClasses[0]},
  },
  {
    title: 'Operator',
    props: {className: expressionTableColumnsClasses[1]},
  },
  {
    title: 'Value',
    props: {className: expressionTableColumnsClasses[2]},
  },
  {
    title: '',
    props: {className: expressionTableColumnsClasses[3]},
  }
];
function expressionRow(osc: ObjectSelectorEditor): RowFunction<expressionProps>{
  /* eslint-disable no-console */
  const objId = Math.floor(Math.random() * 0x10000);
  const keyId = `os-key-${objId}`;
  return ({obj: {expr, isNew}, index, key, style}) => {
    if (isNew) {
      const {key: k, op, value, tmp} = osc.state;
      console.info(`DBG.ObjectSelector.expressionRow.new: ${k}, ${op}, ${JSON.stringify(value)}`);
      const validateNewValue = () => {
        const result = {
          key: null,
          value: null,
        };
        if (_.isEmpty(k)) {
          result.key = "Missing key";
        } else if (/\s/.test(k)) {
          result.key = "Invalid key";
        }
        else if (osc.state.expressions.findIndex((expr) => expr.key == k) !== -1) {
          result.key = 'Duplicate key';
        }
        if ((op !== 'Exists' && op !== 'DoesNotExist') && (_.isEmpty(value) && _.isEmpty(tmp))) {
          result.value = "Value is required";
        }
        return result;
      };
      const validationResult = validateNewValue();
      console.info(`DBG.ObjectSelector.expressionRow.new.validate(${k}, ${op}, ${JSON.stringify(value)}, ${tmp}) => ${JSON.stringify(validationResult)}`);
      const isValid = validationResult.key === null && validationResult.value === null;

      const handleAddClick = () => {
        const newExpr: MatchExpression = {
          key: k,
          operator: op,
        };
        if (op == 'Equals' || op == 'NotEqual') {
          newExpr.value = value as string;
        } else if (op == 'In' || op == 'NotIn') {
          newExpr.values = typeof(value) === "string" ? [value] : ((value as string[]) || []);
          if (tmp !== null) {
            newExpr.values.push(tmp);
          }
        }

        osc.addExpression(newExpr);
        document.getElementById(keyId).focus();
      };
      const inputProps = {
        onChange: (e: any) => {
          console.info(`DBG.ObjectSelector.expressionRow.TagInput.input.onChange(${e.target.value})`)
          osc.setState({tmp: e.target.value});
        },
        onKeyPress: (e: React.KeyboardEvent<EventTarget>) => {
          if (e.charCode == 13) {
            e.preventDefault();
            if (isValid) {
              handleAddClick();
            }
          }
        },
      };

      const renderLayout = (tagComponents: any, inputComponent: any) => {
        return <div className='key-value-editor'>
          <div className="tags">{tagComponents}</div>
          <div className="new-tag">{inputComponent}</div>
        </div>
      };
      const renderTag = ({tag, key, onRemove, getTagDisplayValue}) => (
        <span className="tag-item" key={key}>
          <span className="tag-item__content">{getTagDisplayValue(tag)}</span>
          &nbsp;
          <a className="remove-button" onClick={() => onRemove(key)}>
            ×
          </a>
        </span>
      );
      return <TableRow id={`expr-${index}`} index={index} trKey={key} style={style}>
        <TableData className={expressionTableColumnsClasses[0]}>
          <input
            id={keyId}
            type="text"
            name="key"
            value={k}
            onChange={(e) => osc.setState({key: e.target.value})}
            className={validationResult.key === null ? '' : 'error'}
          />
        </TableData>
        <TableData className={expressionTableColumnsClasses[1]}>
          <Dropdown
            className="dropdown dropdown--full-width"
            items={operatorOptions}
            selectedKey={op}
            onChange={(v: string) => osc.setState({op: v as ExpressionOp, tmp: null})}
          />
        </TableData>
        <TableData className={expressionTableColumnsClasses[2]}>
          {(op == 'In' || op == 'NotIn') && (
            <TagsInput
              value={(typeof value === "string" && !_.isEmpty(value)) ? [value] : (value || [])}
              addKeys={[9]}
              onlyUnique
              inputProps={inputProps}
              renderTag={renderTag}
              renderLayout={renderLayout}
              onChange={(tags: any) => osc.setState({value: tags, tmp: null})}
            />
          )}
          {(op == 'Equals' || op == 'NotEqual') && (
            <input
              type="text"
              name="value"
              value={value}
              placeholder="value"
              className={validationResult.value === null ? '' : 'error'}
              onChange={(e) => osc.setState({value: e.target.value})}
            />
          )}
        </TableData>
        <TableData className={expressionTableColumnsClasses[3]}>
          <Button
            onClick={handleAddClick}
            isAriaDisabled={!isValid}
            disabled={!isValid}>
            Add
          </Button>
        </TableData>
      </TableRow>
    } else {
      /* eslint-disable no-console */
      console.info(`DBG.ObjectSelector.expressionRow: ${JSON.stringify(expr)}`);
      return <TableRow id={`expr-${index}`} index={index} trKey={key} style={style}>
        <TableData className={expressionTableColumnsClasses[0]}>
          {expr.key}
        </TableData>
        <TableData className={expressionTableColumnsClasses[1]}>
          {expr.operator}
        </TableData>
        <TableData className={expressionTableColumnsClasses[2]}>
          {!(expr.operator == 'In' || expr.operator == 'NotIn') && expr.value}
          {(expr.operator == 'In' || expr.operator == 'NotIn') && JSON.stringify(expr.values)}
        </TableData>
        <TableData className={expressionTableColumnsClasses[3]}>
          <a href='#' onClick={(e) => {
            e.preventDefault();

            osc.removeExpression(index);
          }}>
            <CloseIcon color="red" size="sm" />
          </a>
        </TableData>
      </TableRow>
    }
  };
}
export type ObjectSelectorEditorProps = {
  id: string;
  selector: Selector;
  objects: K8sResourceKind[];
  model: K8sKind;
  hideSelectedObjects?: boolean;
  hideObjectList?: boolean;
  showUnselectedRows?: boolean;
  matchedObjectsTitle: string;
  onChange: (selector: Selector) => void;
};
type objectSelectorComponentState = {
  key: string;
  op: ExpressionOp;
  value: string|string[]|null;
  tmp?: string;
  expressions: MatchExpression[];
  objects: K8sResourceKind[];
};
export class ObjectSelectorEditor extends React.Component<ObjectSelectorEditorProps, objectSelectorComponentState> {
  constructor(props: ObjectSelectorEditorProps) {
    super(props);

    const {selector} = props;
    this.state = {
      key: '',
      op: 'Equals',
      value: '',
      expressions: createExpressionList(selector),
      objects: props.objects,
    };
  }

  mayAddExpression(key: string, value: string) {
    const {expressions} = this.state;
    const n = expressions.findIndex((expr) => expr.key == key);
    if (n === -1) {
      return true;
    }
    const expr = expressions[n];
    // if (expr.operator === 'Equals') {
    //   return expr.value !== value;
    // }
    if (expr.operator === 'In') {
      return (expr.values || []).indexOf(value) === -1;
    }
    return false;
  }
  addExpression(expr: MatchExpression) {
    this.setState(({expressions}) => {
      const newExpressions = [...expressions, expr];
      const selector = createSelector(newExpressions);
      this.props.onChange(selector);
      return {
        expressions: newExpressions,
        key: '',
        op: 'Equals',
        value: null,
        tmp: null,
      }
    })
  }
  addOrMergeExpression(key: string, value: string) {
    this.setState(({expressions}) => {
      const newExpressions = [...expressions];
      const n = newExpressions.findIndex((expr) => expr.key == key);
      if (n === -1) {
        newExpressions.push({key, value, operator: 'Equals'});
      } else {
        const expr = newExpressions[n];
        const values = expr.values || [];
        if (expr.operator === 'In' && !values.includes(value)) {
          newExpressions[n] = {
            key: key,
            operator: 'In',
            values: [...values, value],
          };
        }
      }

      const selector = createSelector(newExpressions);
      this.props.onChange(selector);
      return {expressions: newExpressions};
    });
  }
  removeExpression(index: number) {
    this.setState(({expressions}) => {
      const updatedExpressions = [...expressions];
      updatedExpressions.splice(index, 1);
      const selector = updatedExpressions.length
        ? createSelector(updatedExpressions)
        : null;
      this.props.onChange(selector);
      return {expressions: updatedExpressions};
    });
  }

  render() {
    const {objects, expressions} = this.state;
    const { id, model, hideSelectedObjects, hideObjectList, matchedObjectsTitle, showUnselectedRows } = this.props;
    const selector = createSelector(expressions);
    const expressionsAndNewOne = [
      ...expressions.map((expr) => ({expr, isNew: false})),
       {isNew: true, expr: null}
    ];
    const selectedObjects = _.isEmpty(expressions)
      ? []
      : objects.filter((o) => isMatch(o.metadata, selector));
    const objectList = showUnselectedRows
      ? objects
      : objects.filter((obj) => isMatch(obj.metadata, selector));
    return <>
      <div className="object-selector-control" id={id}>
        {!hideSelectedObjects && (
          <div className="selected-objects">
            {selectedObjects.map((o) => (
              <span>
                <ResourceIcon kind={model.kind} />
                &nbsp;
                {o.metadata?.name}
              </span>
            ))}
          </div>
        )}
        <div className="object-selector">
          <Table
            data={expressionsAndNewOne}
            Header={expressionTableColumnsHeaders}
            Row={expressionRow(this)}
            aria-label="Selector"
            loaded
          />
        </div>
        {!hideObjectList && (
          <div className="object-list">
            <label className="control-label">{matchedObjectsTitle}</label>
            <Table
              data={objectList.map((obj) => ({
                kind: model.kind,
                obj,
                selected: !_.isEmpty(expressions) && isMatch(obj.metadata, selector),
                mayAddKeyValue: this.mayAddExpression.bind(this),
                addKeyValue: this.addOrMergeExpression.bind(this),
              }))}
              Row={objectListRow}
              Header={objectListHeaders}
              aria-label="unselected-objects"
              loaded
            />
          </div>
        )}
      </div>
    </>
  }
};
