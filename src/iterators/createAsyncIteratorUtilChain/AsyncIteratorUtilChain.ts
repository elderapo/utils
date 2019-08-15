import { SyncOrAsync } from "../../types";

export type FilterFN<T> = (item: T) => boolean;
export type MapFN<FROM, TO> = (item: FROM) => SyncOrAsync<TO>;

export class AsyncIteratorUtilChain<T> {
  constructor(private iterator: AsyncIterableIterator<T>) {}

  public filter(filterFN: FilterFN<T>): AsyncIteratorUtilChain<T> {
    const { iterator } = this;

    const createAI = async function*() {
      for await (const item of iterator) {
        if (filterFN(item)) {
          yield item;
        }
      }
    };

    return new AsyncIteratorUtilChain(createAI());
  }

  public map<TO>(mapFN: MapFN<T, TO>): AsyncIteratorUtilChain<TO> {
    const { iterator } = this;

    const createAI = async function*() {
      for await (const item of iterator) {
        yield mapFN(item);
      }
    };

    return new AsyncIteratorUtilChain(createAI());
  }

  public finish(): AsyncIterableIterator<T> {
    return this.iterator;
  }
}
