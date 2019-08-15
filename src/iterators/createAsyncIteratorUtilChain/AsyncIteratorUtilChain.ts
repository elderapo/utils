import { isAsyncIterable } from "iterall";
import { SyncOrAsync } from "../../types";

export type FilterFN<T> = (item: T) => SyncOrAsync<boolean>;
export type MapFN<FROM, TO> = (item: FROM) => SyncOrAsync<TO>;

export class AsyncIteratorUtilChain<T> {
  private iterable: AsyncIterableIterator<T>;

  constructor(iteratorOrIterable: AsyncIterator<T> | AsyncIterableIterator<T>) {
    if (isAsyncIterable(iteratorOrIterable)) {
      this.iterable = iteratorOrIterable;
      return;
    }

    this.iterable = {
      [Symbol.asyncIterator]: () => this.iterable,
      next: iteratorOrIterable.next.bind(iteratorOrIterable),
      return: iteratorOrIterable.return && iteratorOrIterable.return.bind(iteratorOrIterable),
      throw: iteratorOrIterable.throw && iteratorOrIterable.throw.bind(iteratorOrIterable)
    };
  }

  public filter(filterFN: FilterFN<T>): AsyncIteratorUtilChain<T> {
    const { iterable: iterator } = this;

    const createAI = async function*() {
      for await (const item of iterator) {
        if (await filterFN(item)) {
          yield item;
        }
      }
    };

    return new AsyncIteratorUtilChain(createAI());
  }

  public map<TO>(mapFN: MapFN<T, TO>): AsyncIteratorUtilChain<TO> {
    const { iterable: iterator } = this;

    const createAI = async function*() {
      for await (const item of iterator) {
        yield mapFN(item);
      }
    };

    return new AsyncIteratorUtilChain(createAI());
  }

  public finish(): AsyncIterableIterator<T> {
    return this.iterable;
  }
}
