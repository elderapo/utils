import { comsumeAsyncIterator, createTestAsyncIterator } from "../iterator-test-helpers";
import { chronologicallyCombineAsyncIterators } from "./chronologicallyCombineAsyncIterators";

describe("chronologicallyCombineAsyncIterators", () => {
  it("should work with non delayed pushes", async () => {
    const yieldedValuesRef: number[] = [];

    const initAI = createTestAsyncIterator([{ value: 1 }], yieldedValuesRef);

    const updateAI = createTestAsyncIterator(
      [{ value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }],
      yieldedValuesRef
    );

    await expect(
      comsumeAsyncIterator(chronologicallyCombineAsyncIterators([initAI, updateAI]))
    ).resolves.toMatchObject([1, 2, 3, 4, 5]);

    expect(yieldedValuesRef).toMatchObject([1, 2, 3, 4, 5]);
  });

  it("should work with delayed pushes", async () => {
    const yieldedValuesRef: number[] = [];

    const initAI = createTestAsyncIterator([{ value: 1, delay: 10 }], yieldedValuesRef);

    const updateAI = createTestAsyncIterator(
      [
        { value: 2, delay: 50 },
        { value: 3, delay: 50 },
        { value: 4, delay: 50 },
        { value: 5, delay: 50 }
      ],
      yieldedValuesRef
    );

    await expect(
      comsumeAsyncIterator(chronologicallyCombineAsyncIterators([initAI, updateAI]))
    ).resolves.toMatchObject([1, 2, 3, 4, 5]);

    expect(yieldedValuesRef).toMatchObject([1, 2, 3, 4, 5]);
  });

  it("should work if db init query is slow", async () => {
    const yieldedValuesRef: number[] = [];

    const initAI = createTestAsyncIterator([{ value: 1, delay: 50 }], yieldedValuesRef);

    const updateAI = createTestAsyncIterator(
      [
        { value: 2, delay: 40 },
        { value: 3, delay: 40 },
        { value: 4, delay: 20 },
        { value: 5, delay: 20 }
      ],
      yieldedValuesRef
    );

    await expect(
      comsumeAsyncIterator(chronologicallyCombineAsyncIterators([initAI, updateAI]))
    ).resolves.toMatchObject([1, 2, 3, 4, 5]);

    expect(yieldedValuesRef).toMatchObject([2, 1, 3, 4, 5]);
  });

  it("should work with more live updates", async () => {
    const yieldedValuesRef: number[] = [];

    const initAI = createTestAsyncIterator([{ value: 1, delay: 700 }], yieldedValuesRef);

    const updateAI1 = createTestAsyncIterator(
      [{ value: 2, delay: 100 }, { value: 3, delay: 100 }],
      yieldedValuesRef
    );
    const updateAI2 = createTestAsyncIterator(
      [{ value: 4, delay: 20 }, { value: 5, delay: 20 }],
      yieldedValuesRef
    );

    await expect(
      comsumeAsyncIterator(chronologicallyCombineAsyncIterators([initAI, updateAI1, updateAI2]))
    ).resolves.toMatchObject([1, 2, 3, 4, 5]);

    expect(yieldedValuesRef).toMatchObject([4, 5, 2, 3, 1]);
  });

  it("should correctly break on initAI", async () => {
    const yieldedValuesRef: number[] = [];

    const initAI = createTestAsyncIterator(
      [{ value: 1, delay: 20 }, { value: 2, delay: 5 }],
      yieldedValuesRef
    );

    const updateAI = createTestAsyncIterator(
      [{ value: 3, delay: 5 }, { value: 4, delay: 80 }, { value: 5, delay: 20 }],
      yieldedValuesRef
    );

    await expect(
      comsumeAsyncIterator(chronologicallyCombineAsyncIterators([initAI, updateAI]), {
        shouldBreakOn: value => value === 2
      })
    ).resolves.toMatchObject([1]);

    expect(yieldedValuesRef).toMatchObject([3, 1, 2]);
  });

  it("should correctly break on updateAI", async () => {
    const yieldedValuesRef: number[] = [];

    const initAI = createTestAsyncIterator(
      [{ value: 1, delay: 1 }, { value: 2, delay: 15 }],
      yieldedValuesRef
    );

    const updateAI = createTestAsyncIterator(
      [{ value: 3, delay: 10 }, { value: 4, delay: 10 }, { value: 5, delay: 10 }],
      yieldedValuesRef
    );

    await expect(
      comsumeAsyncIterator(chronologicallyCombineAsyncIterators([initAI, updateAI]), {
        shouldBreakOn: value => value === 4
      })
    ).resolves.toMatchObject([1, 2, 3]);

    expect(yieldedValuesRef).toMatchObject([1, 3, 2, 4]);
  });

  it("should correctly handle exceptions in initAI", async () => {
    const yieldedValuesRef: number[] = [];

    const initAI = createTestAsyncIterator(
      [{ value: 1, delay: 5 }, { value: 2, delay: 10, shouldThrow: true }, { value: 3, delay: 10 }],
      yieldedValuesRef
    );

    const updateAI = createTestAsyncIterator(
      [{ value: 4, delay: 10 }, { value: 5, delay: 10 }],
      yieldedValuesRef
    );

    await expect(
      comsumeAsyncIterator(chronologicallyCombineAsyncIterators([initAI, updateAI]))
    ).resolves.toMatchObject([1, new Error("CREATOR_THROWING::2")]);

    expect(yieldedValuesRef).toMatchObject([1, 4]);
  });

  it("should correctly handle exceptions in updateAI", async () => {
    const yieldedValuesRef: number[] = [];

    const initAI = createTestAsyncIterator(
      [{ value: 1, delay: 5 }, { value: 2, delay: 50 }, { value: 3, delay: 50 }],
      yieldedValuesRef
    );

    const updateAI = createTestAsyncIterator(
      [
        { value: 4, delay: 10 },
        { value: 5, delay: 10, shouldThrow: true },
        { value: 6, delay: 10 }
      ],
      yieldedValuesRef
    );

    await expect(
      comsumeAsyncIterator(chronologicallyCombineAsyncIterators([initAI, updateAI]))
    ).resolves.toMatchObject([1, 2, 3, 4, new Error("CREATOR_THROWING::5")]);

    expect(yieldedValuesRef).toMatchObject([1, 4, 2, 3]);
  });
});
