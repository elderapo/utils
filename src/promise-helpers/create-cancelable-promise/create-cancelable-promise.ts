export type Cancel = () => void;
export type CancelablePromise<T> = Promise<T> & { cancel: Cancel };

export const createCancelablePromise = <T>(
  promise: Promise<T>,
  cancel: Cancel
): CancelablePromise<T> => {
  Object.assign(promise, {
    cancel
  });

  return promise as CancelablePromise<T>;
};
