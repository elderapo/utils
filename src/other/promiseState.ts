export enum PromiseState {
  Pending,
  Resolved,
  Rejected
}

export type PromiseStateType<T> =
  | PromiseStateTypePending
  | PromiseStateTypeResolved<T>
  | PromiseStateTypeRejected;

export type PromiseStateTypePending = {
  state: PromiseState.Pending;
};

export type PromiseStateTypeResolved<T> = {
  state: PromiseState.Resolved;
  value: T;
};

export type PromiseStateTypeRejected = {
  state: PromiseState.Rejected;
  err: any;
};

export const promiseState = async <T>(promise: Promise<T>): Promise<PromiseStateType<T>> => {
  try {
    const value = await Promise.race([promise, PromiseState.Pending]);

    if (value === PromiseState.Pending) {
      return {
        state: PromiseState.Pending
      };
    }

    return {
      state: PromiseState.Resolved,
      value: value as T
    };
  } catch (err) {
    return {
      state: PromiseState.Rejected,
      err
    };
  }
};

export const isPromiseState = async <T>(
  promise: Promise<T>,
  expectedState: PromiseState
): Promise<boolean> => {
  const { state } = await promiseState(promise);

  return state === expectedState;
};

export const isPending = async <T>(promise: Promise<T>): Promise<boolean> =>
  isPromiseState(promise, PromiseState.Pending);

export const isResolved = async <T>(promise: Promise<T>): Promise<boolean> =>
  isPromiseState(promise, PromiseState.Resolved);

export const isRejected = async <T>(promise: Promise<T>): Promise<boolean> =>
  isPromiseState(promise, PromiseState.Rejected);
