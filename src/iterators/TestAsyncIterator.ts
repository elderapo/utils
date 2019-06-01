import "core-js/modules/es.symbol.async-iterator";
import { sleep } from "../timers";
import { DeepReadonly } from "../types";

const DONE_RETURN_VALUE = (null as any) as number;

export interface ITestAsyncIteratorOptions {
  from: number;
  to: number;
  delay: number;
  throwAt?: number;
  identifier: string;
}

export interface ITestAsyncIteratorState {
  returned: boolean;
  thrownException: Error | null;

  nextResolves: ((val: IteratorResult<number>) => void)[];
  isSourceActive: boolean;
}

export class TestAsyncIterator implements AsyncIterator<number> {
  private state: ITestAsyncIteratorState = {
    returned: false,
    thrownException: null,

    nextResolves: [],
    isSourceActive: true
  };

  private throwPromiseReject: (err: Error) => void;
  private throwPromise = new Promise<IteratorResult<number>>((_, reject) => {
    this.throwPromiseReject = reject;
  });

  private returnPromiseResolve: (ret: IteratorResult<number>) => void;
  private returnPromise = new Promise<IteratorResult<number>>(resolve => {
    this.returnPromiseResolve = resolve;
  });

  constructor(private options: DeepReadonly<ITestAsyncIteratorOptions>) {
    this.startFakeEventSource().catch(err => {
      /* istanbul ignore next */
      console.error("startFakeEventSource thew", err);
    });
  }

  private async startFakeEventSource(): Promise<void> {
    const { from, to, delay } = this.options;

    for (let val = from; val < to; val++) {
      /* istanbul ignore next */
      if (this.shouldFakeEventSourceExit()) {
        break;
      }

      await sleep(delay);

      if (this.shouldFakeEventSourceExit()) {
        break;
      }

      const resolve = this.state.nextResolves.shift();

      if (resolve) {
        resolve({ done: false, value: val });
      }
    }

    this.state.isSourceActive = false;
    this.return().catch(() => {
      //
    });
  }

  private shouldFakeEventSourceExit() {
    return this.state.returned || this.state.thrownException || !this.state.isSourceActive;
  }

  private async pullValue(): Promise<IteratorResult<number>> {
    const nextPromise = new Promise<IteratorResult<number>>(resolve => {
      this.state.nextResolves.push(resolve);
    });

    return Promise.race([this.throwPromise, this.returnPromise, nextPromise]);
  }

  public getState(): DeepReadonly<ITestAsyncIteratorState> {
    return this.state;
  }

  public async next(): Promise<IteratorResult<number>> {
    const { value, done } = await this.pullValue();

    if (done) {
      return this.return();
    }

    const { identifier, throwAt } = this.options;

    if (value === throwAt) {
      // Maybe this can be normal throw new Error - gotta test
      return this.throw(new Error(`REQUESTED_THROW_${identifier}_${throwAt}`));
    }

    return { done: false, value: value };
  }

  public async return(): Promise<IteratorResult<number>> {
    this.state.returned = true;
    this.state.isSourceActive = false;

    this.returnPromiseResolve({ done: true, value: DONE_RETURN_VALUE });

    return { done: true, value: DONE_RETURN_VALUE };
  }

  public async throw(err: Error): Promise<never> {
    this.state.thrownException = err;
    this.state.isSourceActive = false;

    this.throwPromiseReject(err);

    throw err;
  }

  public [Symbol.asyncIterator]() {
    return this;
  }
}
