import { comsumeAsyncIterator, createTestAsyncIterator } from "./iteratorTestHelpers";

describe("iteratorTestHelpers", () => {
  it("should work with no delays", async () => {
    const it = createTestAsyncIterator([
      {
        value: 0
      },
      {
        value: 1
      },
      {
        value: 2
      }
    ]);

    await expect(comsumeAsyncIterator(it)).resolves.toMatchObject([0, 1, 2]);
  });

  it("should work with same delays", async () => {
    const it = createTestAsyncIterator([
      {
        value: 0,
        delay: 50
      },
      {
        value: 1,
        delay: 50
      },
      {
        value: 2,
        delay: 50
      }
    ]);

    await expect(comsumeAsyncIterator(it)).resolves.toMatchObject([0, 1, 2]);
  });

  it("should work with different delays", async () => {
    const it = createTestAsyncIterator([
      {
        value: 0,
        delay: 10
      },
      {
        value: 1,
        delay: 50
      },
      {
        value: 2,
        delay: 25
      }
    ]);

    await expect(comsumeAsyncIterator(it)).resolves.toMatchObject([0, 1, 2]);
  });

  it("should return an error if creator throws it", async () => {
    const it = createTestAsyncIterator([
      {
        value: 0,
        delay: 10
      },
      {
        value: 1,
        delay: 50,
        shouldThrow: true
      },
      {
        value: 2,
        delay: 25
      }
    ]);

    await expect(comsumeAsyncIterator(it)).resolves.toMatchObject([
      0,
      new Error("CREATOR_THROWING::1")
    ]);
  });

  it("should throw an error if consumer throws it", async () => {
    const it = createTestAsyncIterator([
      {
        value: 0,
        delay: 10
      },
      {
        value: 1,
        delay: 50
      },
      {
        value: 2,
        delay: 25
      }
    ]);

    await expect(
      comsumeAsyncIterator(it, { shouldThrowOn: it => it === 0 })
    ).resolves.toMatchObject([new Error("CONSUMER_THROWING::0")]);
  });

  it("should throw consumer error if consumer throws before creator", async () => {
    const it = createTestAsyncIterator([
      {
        value: 0,
        delay: 10
      },
      {
        value: 1,
        delay: 50,
        shouldThrow: true
      },
      {
        value: 2,
        delay: 25
      }
    ]);

    await expect(
      comsumeAsyncIterator(it, { shouldThrowOn: it => it === 0 })
    ).resolves.toMatchObject([new Error("CONSUMER_THROWING::0")]);
  });

  it("should correctly act on break", async () => {
    const yieldedValuesRef: number[] = [];

    const it = createTestAsyncIterator(
      [
        {
          value: 0,
          delay: 10
        },
        {
          value: 1,
          delay: 500
        },
        {
          value: 2,
          delay: 250
        }
      ],
      yieldedValuesRef
    );

    await expect(
      comsumeAsyncIterator(it, { shouldBreakOn: it => it === 1 })
    ).resolves.toMatchObject([0]);

    await expect(it.next()).resolves.toMatchObject({
      done: true,
      value: undefined
    });

    await expect(yieldedValuesRef).toMatchObject([0]);
  });
});
