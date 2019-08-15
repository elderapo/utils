import { AsyncIteratorUtilChain } from "./AsyncIteratorUtilChain";

export const createAsyncIteratorUtilChain = <T>(
  iteratorOrIterable: AsyncIterator<T> | AsyncIterableIterator<T>
) => {
  return new AsyncIteratorUtilChain(iteratorOrIterable);
};
