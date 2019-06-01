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

  if (typeof options === "function") {
    return options(decoratorOptions);
  }

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
      const operation = operationQueue.queue.then(() => {
        return method.apply(this, args);
      });
      operationQueue.queue = operation.catch(() => {});
      return operation;
    };
    return descriptor;
  };
};

export const createOperationQueue = (): OperationQueue => {
  return { queue: Promise.resolve() };
};
