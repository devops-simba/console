import * as _ from 'lodash'
import * as React from 'react'
import * as cx from 'classnames';
import { Button } from '@patternfly/react-core'

import './_components.scss'

export type KeyValuePair = {
  key: string;
  value?: string;
};

export type PairElementProps = {
  index: number;
  tagClass?: string | ((index: number) => string);
  removeAction?: (index: number) => void;
  onItemClick?: (index: number) => void;
  clickable?: (index: number) => boolean;
  pair: KeyValuePair;
};
export const PairElement: React.FC<PairElementProps> = (props) => {
  const {pair, removeAction, onItemClick, clickable, tagClass, index} = props;
  /* eslint-disable jsx-a11y/click-events-have-key-events */
  /* eslint-disable jsx-a11y/no-static-element-interactions */
  /* eslint-disable jsx-a11y/anchor-is-valid */
  const isClickable = (clickable || (() => true))(index);
  let className = cx('tag-item', {
    'clickable': isClickable
  });
  if (tagClass) {
    if (typeof(tagClass) === 'string') {
      className = cx(className, tagClass);
    } else {
      className = cx(className, tagClass(index));
    }
  }
  const onClick = (onItemClick && isClickable) ? () => onItemClick(index) : undefined;
  return <span className={className} onClick={onClick}>
    {_.isEmpty(pair.value) && (
      <span className="tag-item__content">{pair.key}</span>
    )}
    {!_.isEmpty(pair.value) && (
      <span className="tag-item__content">{pair.key}={pair.value}</span>
    )}
    {removeAction && (
      <>
        &nbsp;
        <a className="remove-button" onClick={() => (removeAction(index))}>x</a>
      </>
    )}
  </span>
};

export type KeyValueEditorProps = {
  pairs: KeyValuePair[];
  noValue?: boolean;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  tagClass?: (index: number) => string;
  removeAction?: (index: number) => void;
  validator?: (key: string, value: string) => boolean;
  addAction?: (key: string, value: string) => void;
  onItemClick?: (index: number) => void;
  clickable?: (index: number) => boolean;
};
type keyValueEditorState = {
  id: number;
  key: string;
  value: string;
};
export class KeyValueEditor extends React.Component<KeyValueEditorProps, keyValueEditorState> {
  state = {
    key: '',
    value: '',
    id: Math.floor(Math.random() * 9999),
  };
  render() {
    const {
      pairs: p,
      noValue,
      keyPlaceholder,
      valuePlaceholder,
      tagClass,
      removeAction,
      addAction,
      validator,
      onItemClick,
      clickable,
    } = this.props;
    const {key, value} = this.state;
    const pairs = p.map((pair, index) =>
      <PairElement
        index={index}
        pair={pair}
        tagClass={tagClass}
        removeAction={removeAction}
        onItemClick={onItemClick}
        clickable={clickable} />)

    const keyId = `kve-key-${this.state.id}`;
    const valueId = `kve-value-${this.state.id}`;
    const add = () => {
      try {
        addAction(key, value);
      } catch (err) {
        /* eslint-disable no-console */
        console.info(`DBG.KeyValueEditor.add => ERR: ${err.message}`);
      }
      this.setState({key: '', value: ''});
      document.getElementById(keyId).focus();
    };
    const isDisabled = addAction && validator && !validator(key, value);
    const handleKeyUp = (e: any) => {
      if (e.keyCode === 13) {
        e.preventDefault();
        e.stopPropagation();
        if (!isDisabled) {
          add();
        }
      }
    };
    return <div className="key-value-editor">
      {!_.isEmpty(pairs) && <div className="tags">{pairs}</div>}
      {addAction && (
        <div className="new-tag">
          <input
            id={keyId}
            className="input-key"
            name="key"
            value={key}
            placeholder={keyPlaceholder || 'key'}
            onChange={(e) => this.setState({key: e.target.value})}
            onKeyUp={handleKeyUp}
            />
          {!noValue && (
            <input
              id={valueId}
              className="input-value"
              name="value"
              value={value}
              placeholder={valuePlaceholder || 'value'}
              onChange={(e) => this.setState({value: e.target.value})}
              onKeyUp={handleKeyUp}
            />
          )}
          <Button
            type="button"
            variant="secondary"
            isDisabled={isDisabled}
            onClick={add}
          >
            Add
          </Button>
        </div>
      )}
    </div>
  }
};
