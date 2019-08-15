import { sleep } from "../../timers";
import { EagerlyBufferedAsyncIterator } from "./EagerlyBufferedAsyncIterator";

describe("EagerlyBufferedAsyncIterator", () => {
  type TestAsyncIteratorItem<T> = { value: T; delay?: number; shouldThrow?: boolean };

  const createTestAsyncIterator = async function*<T>(
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

  interface IComsumeAsyncIteratorOptions<T> {
    shouldThrow?: (item: T) => boolean;
    shouldBreak?: (item: T) => boolean;
  }

  const comsumeAsyncIterator = async <T>(
    it: AsyncIterableIterator<T>,
    options: IComsumeAsyncIteratorOptions<T> = {}
  ): Promise<(T | Error)[]> => {
    const retItems: (T | Error)[] = [];

    try {
      for await (const item of it) {
        if (options.shouldThrow && options.shouldThrow(item)) {
          throw new Error(`CONSUMER_THROWING::${item}`);
        }

        if (options.shouldBreak && options.shouldBreak(item)) {
          break;
        }

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

      await expect(comsumeAsyncIterator(it)).resolves.toMatchInlineSnapshot(`
                                                                                                                                                          Array [
                                                                                                                                                            0,
                                                                                                                                                            [Error: CREATOR_THROWING::1],
                                                                                                                                                          ]
                                                                                                                                    `);
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

      await expect(comsumeAsyncIterator(it, { shouldThrow: it => it === 0 })).resolves
        .toMatchInlineSnapshot(`
                                                        Array [
                                                          [Error: CONSUMER_THROWING::0],
                                                        ]
                                                `);
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

      await expect(comsumeAsyncIterator(it, { shouldThrow: it => it === 0 })).resolves
        .toMatchInlineSnapshot(`
                                                        Array [
                                                          [Error: CONSUMER_THROWING::0],
                                                        ]
                                                `);
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

      await expect(comsumeAsyncIterator(it, { shouldBreak: it => it === 1 })).resolves
        .toMatchInlineSnapshot(`
                                          Array [
                                            0,
                                          ]
                                    `);

      await expect(it.next()).resolves.toMatchInlineSnapshot(`
                            Object {
                              "done": true,
                              "value": undefined,
                            }
                        `);

      await expect(yieldedValuesRef).toMatchInlineSnapshot(`
              Array [
                0,
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

  it("should correctly throw error if error is thrown before start of consumer", async () => {
    const original = createTestAsyncIterator([
      {
        value: 0,
        shouldThrow: true
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

    await expect(comsumeAsyncIterator(eager)).resolves.toMatchInlineSnapshot(`Array []`);
  });

  it("should correctly throw error if error is thrown after start of consumer", async () => {
    const original = createTestAsyncIterator([
      {
        value: 0,
        delay: 50
      },
      {
        value: 1,
        shouldThrow: true
      },
      {
        value: 2
      }
    ]);

    const eager = new EagerlyBufferedAsyncIterator(original);

    await sleep(10);

    await expect(comsumeAsyncIterator(eager)).resolves.toMatchInlineSnapshot(`
                                                            Array [
                                                              0,
                                                              [Error: CREATOR_THROWING::1],
                                                            ]
                                                  `);
  });
});
