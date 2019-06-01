import "core-js/modules/es.symbol.async-iterator";
import { waitImmediate } from "../timers";
import { prepareAsyncIteratorForIteration } from "./prepareAsyncIteratorForIteration";

interface IAsyncIteratorState {
  returned: boolean;
  thrownException: Error | null;
}

export class AsyncIteratorWithPersistedState<T> implements AsyncIterator<T> {
  private targetSavedEvents: T[] = [];

  private targetState: IAsyncIteratorState = {
    returned: false,
    thrownException: null
  };

  private thisState: IAsyncIteratorState = {
    returned: false,
    thrownException: null
  };

  private nullItem: T = null as any;

  constructor(private target: AsyncIterator<T>) {
    this.startGatherer().catch(err => {
      /* istanbul ignore next */
      console.error("startGatherer thew", err);
    });
  }

  private async startGatherer(): Promise<void> {
    try {
      for await (const targetVal of prepareAsyncIteratorForIteration(this.target)) {
        this.targetSavedEvents.push(targetVal);
      }
    } catch (ex) {
      this.targetState.thrownException = ex;
    } finally {
      this.targetState.returned = true;
    }
  }

  public async next(): Promise<IteratorResult<T>> {
    /* istanbul ignore next */
    if (this.thisState.returned || this.thisState.thrownException) {
      return this.return();
    }

    if (this.targetState.thrownException) {
      return this.throw(this.targetState.thrownException);
    }

    if (this.targetSavedEvents.length) {
      const ev = this.targetSavedEvents.shift()!;

      return { done: false, value: ev };
    }

    if (this.targetState.returned && this.targetSavedEvents.length === 0) {
      return this.return();
    }

    // @TODO: optimize this aka use promise and wait for it to resolve

    await waitImmediate();

    return this.next();
  }

  public async return(): Promise<IteratorResult<T>> {
    this.thisState.returned = true;

    return { done: true, value: this.nullItem };
  }

  public async throw(err: Error): Promise<never> {
    this.thisState.thrownException = err;

    throw err;
  }

  public [Symbol.asyncIterator]() {
    return this;
  }
}
