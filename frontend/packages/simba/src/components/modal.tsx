import * as _ from 'lodash';
import * as React from 'react';
import * as Modal from 'react-modal';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import * as classNames from 'classnames';
import { Router } from 'react-router-dom';
import store from '@console/internal/redux';
import { history } from '@console/internal/components/utils/router';
import {
  PromiseComponent,
  PromiseComponentState,
} from '@console/internal/components/utils/promise-component';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter
} from '@console/internal/components/factory';

export {
  PromiseComponent,
  PromiseComponentState
} from '@console/internal/components/utils/promise-component';
export {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter
} from '@console/internal/components/factory';

export type ModalComponentProps = {
  cancel: (reason?: any) => void;
  close: (value?: any) => void;
};
export type ModalLauncherProps = {
  blocking?: boolean;
  modalClassName?: string;
  cancelWithUndefined?: boolean;
};

export type OmitModalComponentProps<T> = Omit<T, keyof ModalComponentProps>;
export type OmitPromiseComponentState<T> = Omit<T, keyof PromiseComponentState>;

let modalDepth = 0;
let modalContainerId = 'modal-container';
const createModalComponent = <P extends ModalComponentProps>(
  Component: React.ComponentType<P>,
  props: P & ModalLauncherProps,
  newModalContainerId: string) => {
  const modal = (
    <Modal
      isOpen={true}
      contentLabel="Modal"
      onRequestClose={() => props.cancel()}
      className={classNames('modal-dialog', props.modalClassName, `modal-container-${modalDepth}`)}
      overlayClassName="co-overlay"
      shouldCloseOnOverlayClick={!props.blocking}>
      <Component
        {..._.omit(props, 'blocking', 'modalClassName', 'cancelWithUndefined')}
        cancel={props.cancel}
        close={props.close}
      />

      <div id={newModalContainerId}>{/*position of new modal container*/}</div>
    </Modal>
  );

  return modalDepth
    ? modal
    : (
      <Provider store={store}>
        <Router {...{history, basename: window.SERVER_FLAGS.basePath}}>
          {modal}
        </Router>
      </Provider>
    );
};
export const createModalLauncher = <P extends ModalComponentProps>(Component: React.ComponentType<P>)
  : ((props: OmitModalComponentProps<P> & ModalLauncherProps) => Promise<any>) =>
{
  return (props) => {
    return new Promise((resolve, reject) => {
      const modalContainer = document.getElementById(modalContainerId);
      const oldModalContainerId = modalContainerId;
      const newModalContainerId = `modal-container-${modalDepth}`;
      const doClose = () => {
        ReactDOM.unmountComponentAtNode(modalContainer);
        modalContainerId = oldModalContainerId;
        modalDepth -= 1;
      };
      /* eslint-disable @typescript-eslint/no-unused-vars */
      const fullProps = {
        ...props,
        close: (value?: any) => {
          doClose();
          resolve(value);
        },
        cancel: props.cancelWithUndefined
        ? (_reason?: any) => {
            doClose();
            resolve(undefined);
          }
          : (reason?: any) => {
            doClose();
            reject(reason);
          },
      };

      const component = createModalComponent(Component, fullProps as any, newModalContainerId);
      modalContainerId = newModalContainerId;
      modalDepth += 1;
      Modal.setAppElement(modalContainer);
      ReactDOM.render(component, modalContainer);
    });
  };
};

export type ConfirmModalProps = {
  btnText?: string;
  cancelText?: string;
  executeFn: () => Promise<any>;
  submitDanger?: boolean;
  title: string | React.ReactElement;
  message: string | React.ReactElement;
} & ModalComponentProps;
/* eslint-disable no-underscore-dangle */
/* eslint-disable promise/catch-or-return */
class ConfirmModal extends PromiseComponent<ConfirmModalProps, PromiseComponentState> {
  _submit(event: React.FormEvent<EventTarget>) {
    /* eslint-disable no-console */
    console.info(`DBG.confirmModal.submit()`);

    event.preventDefault();
    event.stopPropagation();

    console.info(`DBG.confirmModal.submit() => Calling executeFn`);
    const promise = this.props.executeFn();
    this.handlePromise(
      promise || Promise.resolve(undefined),
    ).then((value?: any) => {
      console.info(`DBG.confirmModal.submit() => Handling executeFn result`);
      this.props.close(value);
      console.info(`DBG.confirmModal.submit() => Close called`);
    });
  }

  render() {
    return (
      <form onSubmit={this._submit.bind(this)} name="form" className="modal-content">
        <ModalTitle>{this.props.title}</ModalTitle>
        <ModalBody>{this.props.message}</ModalBody>
        <ModalSubmitFooter
          cancel={() => this.props.cancel()}
          inProgress={this.state.inProgress}
          errorMessage={this.state.errorMessage}
          submitText={this.props.btnText || 'Confirm'}
          cancelText={this.props.cancelText || 'Cancel'}
          submitDanger={!!this.props.submitDanger}
        />
      </form>
    );
  }
}

export const confirmModal = createModalLauncher(ConfirmModal);
