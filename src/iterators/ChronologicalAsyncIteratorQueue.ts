import "core-js/modules/es7.symbol.async-iterator";
import { waitImmediate } from "../timers";

interface ISingleState<VALUE> {
  done: boolean;
  ex: Error | null;
  values: VALUE[];
  isGatheringLoopRunning: boolean;
}

export type CreateIterator<T> = () => AsyncIterator<T>;

export class ChronologicalAsyncIteratorQueue<VALUE> {
  private state = new WeakMap<CreateIterator<VALUE>, ISingleState<VALUE>>();

  constructor(private createIterators: CreateIterator<VALUE>[]) {
    if (createIterators.length <= 0) {
      throw new Error(
        `ChronologicalAsyncIteratorQueue does not accept empty createIterators array!`
      );
    }

    this.prepareState();
    this.startSeparateIteratorsASAP();
  }

  public finalize() {
    const combinedState = {
      exhaused: false,
      createIteratorIndex: 0,
      createdIterator: this.createIterators[0]()
    };

    const nulledItem = (null as any) as VALUE;

    const combinedAsyncIterator: AsyncIterator<VALUE> = {
      next: async () => {
        this.throwIfAnythingWentWrong();

        const createIteratorFunc = this.createIterators[combinedState.createIteratorIndex];
        this.state.get(createIteratorFunc)!.isGatheringLoopRunning = false;

        const iteratorResult = await combinedState.createdIterator.next();

        if (iteratorResult.done) {
          combinedState.createIteratorIndex++;

          const nextCreateIterator = this.createIterators[combinedState.createIteratorIndex];

          if (!nextCreateIterator) {
            return { done: true, value: nulledItem };
          }

          combinedState.createdIterator = nextCreateIterator();
          return combinedAsyncIterator.next();
        }

        let isDone = combinedState.exhaused;

        return { value: iteratorResult.value, done: isDone };
      },
      throw: /* istanbul ignore next */ async error => {
        this.freeEverything();

        throw error;
      },
      return: async () => {
        combinedState.exhaused = true;

        this.freeEverything();

        return { done: true, value: nulledItem }; // tmp
      }
    };

    return combinedAsyncIterator;
  }

  private prepareState() {
    for (const createIterator of this.createIterators) {
      this.state.set(createIterator, {
        done: false,
        ex: null,
        values: [],
        isGatheringLoopRunning: true
      });
    }
  }

  private startSeparateIteratorsASAP() {
    for (const createIterator of this.createIterators) {
      /* istanbul ignore next */
      this.startSingeSeparateIterators(createIterator).catch(err => {
        console.error(`Catched error in startSeparateIteratorsASAP!`, err);
      });
    }
  }

  private async startSingeSeparateIterators(createIterator: CreateIterator<VALUE>): Promise<void> {
    const s = this.state.get(createIterator)!;

    // thanks to this line first tick on first iterator does not get run twice
    await waitImmediate();

    if (!s.isGatheringLoopRunning) {
      return;
    }

    s.isGatheringLoopRunning = true;
    const it = createIterator();

    while (s.isGatheringLoopRunning) {
      // just in case
      /* istanbul ignore next */
      if (s.done) {
        return;
      }

      // just in case
      /* istanbul ignore next */
      if (this.didAnythingThrow()) {
        s.isGatheringLoopRunning = false;
        return;
      }

      let item: IteratorResult<VALUE>;

      try {
        item = await it.next();
      } catch (ex) {
        s.ex = ex;

        s.isGatheringLoopRunning = false;
        return;
      }

      if (item.done) {
        s.isGatheringLoopRunning = false;
        return;
      }

      s.values.push(item.value);
    }
  }

  private getThrownValue(): Error | null {
    for (const createIterable of this.createIterators) {
      const s = this.state.get(createIterable)!;

      if (s.ex) {
        return s.ex;
      }
    }

    return null;
  }

  private freeEverything() {
    for (const createIterator of this.createIterators) {
      const c = this.state.get(createIterator)!;
      c.done = true;
      c.isGatheringLoopRunning = false;
    }
  }

  private didAnythingThrow(): boolean {
    return !!this.getThrownValue();
  }

  private throwIfAnythingWentWrong(): void {
    if (this.didAnythingThrow()) {
      throw this.getThrownValue();
    }
  }
}
