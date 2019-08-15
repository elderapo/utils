import { createTestAsyncIterator, comsumeAsyncIterator } from "../iterator-test-helpers";
import { createAsyncIteratorUtilChain } from "./createAsyncIteratorUtilChain";

describe("createAsyncIteratorUtilChain", () => {
  it("should work", async () => {
    const yieldedValuesRef: number[] = [];

    const getNewIterator = () =>
      createTestAsyncIterator(
        [
          { value: 0, delay: 10 },
          { value: 1, delay: 8 },
          { value: 2, delay: 20 },
          { value: 3, delay: 30 },
          { value: 4, delay: 50 },
          { value: 5, delay: 100 },
          { value: 6 },
          { value: 7, delay: 30 },
          { value: 8, delay: 30 },
          { value: 9, delay: 30 },
          { value: 10, delay: 30 },
          { value: 11, delay: 30 },
          { value: 12, delay: 30 }
        ],
        yieldedValuesRef
      );

    await expect(
      comsumeAsyncIterator(
        createAsyncIteratorUtilChain(getNewIterator())
          .filter(item => item % 2 !== 0)
          .finish()
      )
    ).resolves.toMatchObject([1, 3, 5, 7, 9, 11]);

    await expect(
      comsumeAsyncIterator(
        createAsyncIteratorUtilChain(getNewIterator())
          .filter(item => item % 2 !== 0)
          .filter(item => item > 5)
          .finish()
      )
    ).resolves.toMatchObject([7, 9, 11]);

    await expect(
      comsumeAsyncIterator(
        createAsyncIteratorUtilChain(getNewIterator())
          .filter(item => item % 2 === 0)
          .filter(item => item < 5)
          .map(item => `mapped::${item}`)
          .finish()
      )
    ).resolves.toMatchObject(["mapped::0", "mapped::2", "mapped::4"]);
  });
});
