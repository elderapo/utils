import "core-js/modules/es.symbol.async-iterator";

export class IterableAsyncIterator<T> {
  constructor(private target: AsyncIterator<T>) {}

  public [Symbol.asyncIterator]() {
    return this.target;
  }
}

export const prepareAsyncIteratorForIteration = <T>(ai: AsyncIterator<T>) => {
  return new IterableAsyncIterator(ai);
};
