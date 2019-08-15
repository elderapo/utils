import { EagerlyBufferedAsyncIterator } from "../EagerlyBufferedAsyncIterator";

export const chronologicallyCombineAsyncIterators = async function*<T>(
  lazy: AsyncIterableIterator<T>[]
): AsyncIterableIterator<T> {
  const eager = lazy.map(it => new EagerlyBufferedAsyncIterator(it));

  for (const eagerIterator of eager) {
    for await (const value of eagerIterator) {
      yield value;
    }
  }
};
