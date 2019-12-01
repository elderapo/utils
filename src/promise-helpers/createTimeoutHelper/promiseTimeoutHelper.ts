export interface ICreateTimeoutHelperOptions {
  timeout: number;
  constructTimeoutErrorInstance?: () => Error;
}

export interface ICreateTimeoutHelperResult {
  timeoutPromise: Promise<never>;
  cancelTimeout: () => void;
}

export const createTimeoutHelper = (
  options: ICreateTimeoutHelperOptions
): ICreateTimeoutHelperResult => {
  let timeout: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<never>(async (_, reject) => {
    timeout = setTimeout(() => {
      const err = options.constructTimeoutErrorInstance
        ? options.constructTimeoutErrorInstance()
        : new Error(`Timed out after: ${options.timeout}ms!`);

      return reject(err);
    }, options.timeout);

    /* istanbul ignore next */
    if (timeout.unref) {
      timeout.unref(); // no need to keep event loop alive
    }
  });

  return {
    timeoutPromise,
    cancelTimeout: () => {
      /* istanbul ignore next */
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  };
};
