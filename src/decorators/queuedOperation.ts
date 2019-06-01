export interface OperationQueue {
  queue: Promise<void>;
}

export type QueuedOperationOptions =
  | OperationQueue
  | ((decoratorOptions: DecoratorOptions) => OperationQueue);

const getOperationQueueFromOptions = (
  decoratorOptions: DecoratorOptions,
  options?: QueuedOperationOptions
): OperationQueue => {
  if (!options) {
    return createOperationQueue();
  }

  /* istanbul ignore next */
  if (typeof options === "function") {
    return options(decoratorOptions);
  }

  /* istanbul ignore next */
  throw new Error(`Invalid queuedOperation options!`);
};

export type DecoratorOptions = {
  target: any;
  key: string;
  descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>;
};

export const queuedOperation = (options?: QueuedOperationOptions) => {
  return function(
    target: any,
    key: string,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>
  ) {
    const operationQueue = getOperationQueueFromOptions(
      {
        target,
        key,
        descriptor
      },
      options
    );

    const method = descriptor.value!;

    descriptor.value = function(...args: any[]) {
      const operation = operationQueue.queue.then(() => method.apply(this, args));

      // tslint:disable-next-line
      operationQueue.queue = operation.catch(() => {});

      return operation;
    };

    return descriptor;
  };
};

export const createOperationQueue = (): OperationQueue => {
  return { queue: Promise.resolve() };
};
