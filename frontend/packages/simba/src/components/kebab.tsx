import { isEmpty } from 'lodash'
import { confirmModal } from './modal'

export type objectWithState = {
  state: any,
  setState: (state: any) => any,
};

export const addToCollectionAction = (owner: objectWithState, collectionName: string) => {
  return async (obj: any) => {
    owner.setState((state: any) => {
      return { [collectionName]: [...state[collectionName], obj] };
    });
  };
}
export function editCollectionAction<T = any>(owner: objectWithState, collectionName: string,
  fix?: (obj: T) => T) {
  return (obj: T, index: number) => {
    owner.setState((state: any) => {
      const collection = [...state[collectionName]];
      if (fix) {
        collection[index] = fix(obj);
      } else {
        collection[index] = obj;
      }
      return {[collectionName]: collection};
    });
  };
};
export const deleteFromCollectionAction = (owner: objectWithState, collectionName: string,
  objectType?: string, confirmMessage?: any) => {
  const deleteAction = async (index: number) => {
    owner.setState((state: any) => {
      const collection = [...state[collectionName]];
      collection.splice(index, 1);
      return {[collectionName]: collection};
    });
    return null;
  };
  return (isEmpty(objectType) && isEmpty(confirmMessage))
    ? deleteAction
    : async (index: number) => {
      const props = {
        title: isEmpty(objectType) ? 'Delete' : `Delete ${objectType}`,
        message: isEmpty(confirmMessage)
          ? `Are you sure that you want to remove this ${isEmpty(objectType) ? 'item' : objectType}?`
          : confirmMessage,
        btnText: 'Yes',
        cancelText: 'No',
        submitDanger: true,
        executeFn: async () => {
          /* eslint-disable no-console */
          console.info(`DBG.deleteFromCollectionAction() => start`);
          const result = await deleteAction(index);
          console.info(`DBG.deleteFromCollectionAction() => STOPPED`);
          return result;
        }
      };
      return confirmModal(props);
    };
}

export const editObject = (owner: any, prop: string, type: string, index: number, editor: any) => {
  return {
    label: `Edit ${type}`,
    callback: () => {
      editor({
        obj: owner.state[prop][index],
        action: (obj: any) => {
          owner.setState((state: any) => {
            const updatedCollection = [...state[prop]];
            updatedCollection[index] = obj;
            return { [prop]: updatedCollection };
          })
        }
      })
    }
  };
};
export const deleteObject = (owner: any, prop: string, type: string, index: number) => {
  return {
    label: `Delete ${type}`,
    callback: () => {
      confirmModal({
        title: `Delete ${type}`,
        message: `Are you sure that you want to remove this ${type}?`,
        btnText: 'Yes',
        cancelText: 'No',
        submitDanger: true,
        executeFn: () => {
          owner.setState((state: any) => {
            const updatedCollection = [...state[prop]];
            updatedCollection.splice(index, 1);
            return {[prop]: updatedCollection};
          });
        },
      });
    }
  };
};
export const editAndDeleteMenuActions = (owner: any, prop: string, type: string, index: number, editor: any) => {
  return [
    editObject(owner, prop, type, index, editor),
    deleteObject(owner, prop, type, index),
  ]
}
