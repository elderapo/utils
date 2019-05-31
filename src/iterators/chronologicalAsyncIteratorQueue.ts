import { waitImmediate } from "../timers/waitImmediate";

export interface ISingleState<VALUE> {
  done: boolean;
  ex: Error | null;
  values: VALUE[];
  isGatheringLoopRunning: boolean;
}

export type CreateIterator<T> = () => AsyncIterator<T>;

export const chronologicalAsyncIteratorQueue = <VALUE>(
  createIterators: CreateIterator<VALUE>[]
) => {
  const state = new WeakMap<CreateIterator<VALUE>, ISingleState<VALUE>>();

  const getThrownValue = () => {
    for (const createIterable of createIterators) {
      const s = state.get(createIterable)!;

      if (s.ex) {
        return s.ex;
      }
    }

    return null;
  };

  const didAnythingThrow = () => {
    return !!getThrownValue();
  };

  const throwIfAnythingWentWrong = () => {
    if (didAnythingThrow()) {
      throw getThrownValue();
    }
  };

  const prepareState = () => {
    for (const createIterator of createIterators) {
      state.set(createIterator, {
        done: false,
        ex: null,
        values: [],
        isGatheringLoopRunning: true
      });
    }
  };

  const startSeparateIteratorsASAP = () => {
    for (const createIterator of createIterators) {
      (async () => {
        // thanks to this line first tick on first iterator does not get run twice
        await waitImmediate();

        const s = state.get(createIterator)!;

        if (!s.isGatheringLoopRunning) {
          return;
        }

        s.isGatheringLoopRunning = true;
        const it = createIterator();

        while (true) {
          if (!s.isGatheringLoopRunning) {
            return;
          }

          // just in case
          /* istanbul ignore next */
          if (s.done) {
            return;
          }

          // just in case
          /* istanbul ignore next */
          if (didAnythingThrow()) {
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
      })();
    }
  };

  const nulledItem = (null as any) as VALUE;

  const freeEverything = () => {
    for (const createIterator of createIterators) {
      const c = state.get(createIterator)!;
      c.done = true;
      c.isGatheringLoopRunning = false;
    }
  };

  const createFinalLoop = () => {
    const combinedState = {
      exhaused: false,
      createIteratorIndex: 0,
      createdIterator: createIterators[0]()
    };

    const combinedAsyncIterator: AsyncIterator<VALUE> = {
      async next() {
        throwIfAnythingWentWrong();

        const createIteratorFunc = createIterators[combinedState.createIteratorIndex];

        if (state.has(createIteratorFunc)) {
          state.get(createIteratorFunc)!.isGatheringLoopRunning = false;
        }

        const iteratorResult = await combinedState.createdIterator.next();

        if (iteratorResult.done) {
          combinedState.createIteratorIndex++;

          const nextCreateIterator = createIterators[combinedState.createIteratorIndex];

          if (!nextCreateIterator) {
            return { done: true, value: nulledItem };
          }

          combinedState.createdIterator = nextCreateIterator();
          return this.next();
        }

        let isDone = combinedState.exhaused;

        return { value: iteratorResult.value, done: isDone };
      },
      async throw(e) {
        /* istanbul ignore next */
        freeEverything();

        /* istanbul ignore next */
        throw e;
      },
      async return() {
        combinedState.exhaused = true;

        freeEverything();

        return { done: true, value: nulledItem }; // tmp
      }
    };

    return combinedAsyncIterator;
  };

  prepareState();
  startSeparateIteratorsASAP();
  createFinalLoop();
  return createFinalLoop();
};
