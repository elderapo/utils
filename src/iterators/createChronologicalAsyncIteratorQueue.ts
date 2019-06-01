import { AsyncIteratorWithPersistedState } from "./AsyncIteratorWithPersistedState";

export class ChronologicalAsyncIteratorQueue<T> implements AsyncIterator<T> {
  private persisted: AsyncIteratorWithPersistedState<T>[];

  private nullItem: T = null as any;

  public constructor(asyncIterators: AsyncIterator<T>[]) {
    this.persisted = asyncIterators.map(it => new AsyncIteratorWithPersistedState(it));
  }

  private async cleanup() {
    try {
      for await (const it of this.persisted) {
        break;
      }
    } catch (ex) {
      //
    }
  }

  public async next(): Promise<IteratorResult<T>> {
    try {
      const current = this.persisted[0];

      if (!current) {
        return this.return();
      }

      const result = await current.next();

      if (result.done) {
        this.persisted.shift();
        return this.next();
      }

      return result;
    } catch (ex) {
      /* istanbul ignore next */
      await this.throw(ex);

      /* istanbul ignore next */
      return null as any; // ts error workaround, this.throw won't allow reaching this point
    }
  }

  public async return(): Promise<IteratorResult<T>> {
    await this.cleanup();

    return { done: true, value: this.nullItem };
  }

  public async throw(err: Error): Promise<never> {
    /* istanbul ignore next */
    await this.cleanup();

    /* istanbul ignore next */
    throw err;
  }

  public [Symbol.asyncIterator]() {
    return this;
  }
}

export const createChronologicalAsyncIteratorQueue = <T>(asyncIterators: AsyncIterator<T>[]) => {
  const chronologicalAsyncIteratorQueue = new ChronologicalAsyncIteratorQueue(asyncIterators);

  return chronologicalAsyncIteratorQueue;
};
