import { sleep } from "../../timers";

export type TestAsyncIteratorItem<T> = { value: T; delay?: number; shouldThrow?: boolean };

export const createTestAsyncIterator = async function*<T>(
  items: TestAsyncIteratorItem<T>[],
  yieldedValues: T[] = []
): AsyncIterableIterator<T> {
  for (const { value, shouldThrow, delay } of items) {
    if (typeof delay === "number") {
      await sleep(delay);
    }

    if (shouldThrow) {
      throw new Error(`CREATOR_THROWING::${value}`);
    }

    yield value;
    yieldedValues.push(value);
  }
};

export interface IComsumeAsyncIteratorOptions<T> {
  shouldThrowOn?: (item: T) => boolean;
  shouldBreakOn?: (item: T) => boolean;
}

export const comsumeAsyncIterator = async <T>(
  it: AsyncIterableIterator<T>,
  options: IComsumeAsyncIteratorOptions<T> = {}
): Promise<(T | Error)[]> => {
  const retItems: (T | Error)[] = [];

  try {
    for await (const item of it) {
      if (options.shouldThrowOn && options.shouldThrowOn(item)) {
        throw new Error(`CONSUMER_THROWING::${item}`);
      }

      if (options.shouldBreakOn && options.shouldBreakOn(item)) {
        break;
      }

      retItems.push(item);
    }
  } catch (ex) {
    retItems.push(ex);
  }

  return retItems;
};
