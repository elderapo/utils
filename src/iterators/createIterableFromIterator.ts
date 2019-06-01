import "core-js/modules/es7.symbol.async-iterator";

export const createIterableFromIterator = <T>(iterator: AsyncIterator<T>): AsyncIterable<T> => {
  return {
    [Symbol.asyncIterator]: () => iterator
  };
};
