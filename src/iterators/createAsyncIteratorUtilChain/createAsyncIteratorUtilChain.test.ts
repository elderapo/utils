import { createTestAsyncIterator, comsumeAsyncIterator } from "../iterator-test-helpers";
import { createAsyncIteratorUtilChain } from "./createAsyncIteratorUtilChain";
import { sleep } from "../../timers";

describe("createAsyncIteratorUtilChain", () => {
  const getNewIterator = () =>
    createTestAsyncIterator([
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
    ]);

  it("should work with sync mappers", async () => {
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

  it("should work with async mappers", async () => {
    await expect(
      comsumeAsyncIterator(
        createAsyncIteratorUtilChain(getNewIterator())
          .filter(async item => {
            await sleep(100);
            return item % 2 !== 0;
          })
          .finish()
      )
    ).resolves.toMatchObject([1, 3, 5, 7, 9, 11]);

    await expect(
      comsumeAsyncIterator(
        createAsyncIteratorUtilChain(getNewIterator())
          .filter(async item => {
            await sleep(50);
            return item % 2 !== 0;
          })
          .filter(async item => {
            await sleep(50);
            return item > 5;
          })
          .finish()
      )
    ).resolves.toMatchObject([7, 9, 11]);

    await expect(
      comsumeAsyncIterator(
        createAsyncIteratorUtilChain(getNewIterator())
          .filter(async item => {
            await sleep(50);
            return item % 2 === 0;
          })
          .filter(async item => {
            await sleep(50);
            return item < 5;
          })
          .map(async item => {
            await sleep(50);
            return `mapped::${item}`;
          })
          .finish()
      )
    ).resolves.toMatchObject(["mapped::0", "mapped::2", "mapped::4"]);
  });
});
