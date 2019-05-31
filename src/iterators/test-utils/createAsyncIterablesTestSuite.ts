import { sleep } from "../../timers";

export const createAsyncIterablesTestSuite = () => {
  const callResults: string[] = [];

  const createTestableAsyncIteratorThatThrowsAt = (
    from: number,
    to: number,
    delay: number,
    throwAt: number,
    identifier: string
  ) => {
    const state = {
      start: from,
      end: to,
      current: from,
      delay,
      exhaused: false
    };

    const asyncIterator: AsyncIterator<number> = {
      async next() {
        callResults.push(JSON.stringify(["next", identifier, state]));

        if (state.current >= state.end || state.exhaused) {
          return { done: true, value: state.current };
        }

        await sleep(delay);

        if (state.current === throwAt) {
          throw new Error(`REQUESTED_THROW_${identifier}_${state.current}`);
        }

        return { value: state.current++, done: false };
      },
      async throw(e) {
        callResults.push(JSON.stringify(["throw", identifier, state]));

        throw e;
      },
      async return() {
        callResults.push(JSON.stringify(["return", identifier, state]));

        state.exhaused = true;
        return { done: true, value: state.current };
      }
    };
    return asyncIterator;
  };

  const createTestableAsyncIterator = (
    from: number,
    to: number,
    delay: number,
    identifier: string
  ) =>
    createTestableAsyncIteratorThatThrowsAt(from, to, delay, (null as any) as number, identifier);

  return { createTestableAsyncIterator, createTestableAsyncIteratorThatThrowsAt, callResults };
};
