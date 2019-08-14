import { sleep } from "../../timers";
import { EagerlyBufferedAsyncIterator } from "./EagerlyBufferedAsyncIterator";

describe("EagerlyBufferedAsyncIterator", () => {
  type TestAsyncIteratorItem<T> = { value: T; delay?: number; shouldThrow?: boolean };

  const createTestAsyncIterator = async function*<T>(
    items: TestAsyncIteratorItem<T>[]
  ): AsyncIterableIterator<T> {
    for (const { value, shouldThrow, delay } of items) {
      if (typeof delay === "number") {
        await sleep(delay);
      }

      if (shouldThrow) {
        throw new Error(`THROWING::${value}`);
      }

      yield value;
    }
  };

  const comsumeAsyncIterator = async <T>(it: AsyncIterableIterator<T>): Promise<(T | Error)[]> => {
    const retItems: (T | Error)[] = [];

    try {
      for await (const item of it) {
        retItems.push(item);
      }
    } catch (ex) {
      retItems.push(ex);
    }

    return retItems;
  };

  describe("check if test helpers work correctly", () => {
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

      await expect(comsumeAsyncIterator(it)).resolves.toMatchInlineSnapshot(`
                                                                                    Array [
                                                                                      0,
                                                                                      1,
                                                                                      2,
                                                                                    ]
                                                                        `);
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

      await expect(comsumeAsyncIterator(it)).resolves.toMatchInlineSnapshot(`
                                                                                      Array [
                                                                                        0,
                                                                                        1,
                                                                                        2,
                                                                                      ]
                                                                          `);
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

      await expect(comsumeAsyncIterator(it)).resolves.toMatchInlineSnapshot(`
                                                                                        Array [
                                                                                          0,
                                                                                          1,
                                                                                          2,
                                                                                        ]
                                                                            `);
    });

    it("should throw an error", async () => {
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

      await expect(comsumeAsyncIterator(it)).resolves.toMatchInlineSnapshot(`
                                                                      Array [
                                                                        0,
                                                                        [Error: THROWING::1],
                                                                      ]
                                                            `);
    });
  });

  it("should work with no delays between values", async () => {
    const original = createTestAsyncIterator([
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

    const eager = new EagerlyBufferedAsyncIterator(original);

    await sleep(100);

    await expect(comsumeAsyncIterator(eager)).resolves.toMatchInlineSnapshot(`
            Array [
              0,
              1,
              2,
            ]
          `);
  });

  it("should work with same delays between values", async () => {
    const original = createTestAsyncIterator([
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

    const eager = new EagerlyBufferedAsyncIterator(original);

    await sleep(100);

    await expect(comsumeAsyncIterator(eager)).resolves.toMatchInlineSnapshot(`
            Array [
              0,
              1,
              2,
            ]
          `);
  });

  it("should work with different delays between values", async () => {
    const original = createTestAsyncIterator([
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

    const eager = new EagerlyBufferedAsyncIterator(original);

    await sleep(100);

    await expect(comsumeAsyncIterator(eager)).resolves.toMatchInlineSnapshot(`
            Array [
              0,
              1,
              2,
            ]
          `);
  });

  it("should work with original async iterator that instantly pushes values", async () => {
    const original = createTestAsyncIterator([
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

    const eager = new EagerlyBufferedAsyncIterator(original);

    await expect(comsumeAsyncIterator(eager)).resolves.toMatchInlineSnapshot(`
            Array [
              0,
              1,
              2,
            ]
          `);
  });

  it("should work when original iterator finishes before consuming eager one", async () => {
    const original = createTestAsyncIterator([
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

    const eager = new EagerlyBufferedAsyncIterator(original);

    await sleep(250);

    await expect(comsumeAsyncIterator(eager)).resolves.toMatchInlineSnapshot(`
            Array [
              0,
              1,
              2,
            ]
          `);
  });
});
