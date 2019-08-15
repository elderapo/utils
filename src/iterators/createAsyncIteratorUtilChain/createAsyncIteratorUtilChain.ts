import { AsyncIteratorUtilChain } from "./AsyncIteratorUtilChain";

export const createAsyncIteratorUtilChain = <T>(inIT: AsyncIterableIterator<T>) => {
  return new AsyncIteratorUtilChain(inIT);
};
