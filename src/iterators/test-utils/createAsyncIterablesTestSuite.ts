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
        await sleep(delay);

        if (state.current === throwAt) {
          callResults.push(JSON.stringify(["throw", identifier, state]));
          throw new Error(`REQUESTED_THROW_${identifier}_${state.current}`);
        }

        if (state.current >= state.end || state.exhaused) {
          callResults.push(JSON.stringify(["next-done", identifier, state]));
          return { done: true, value: state.current };
        }

        callResults.push(JSON.stringify(["next", identifier, state]));

        return { value: state.current++, done: false };
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
