export const createIterableFromIterator = <T>(iterator: AsyncIterator<T>): AsyncIterable<T> => {
  return {
    [Symbol.asyncIterator]: () => iterator
  };
};
