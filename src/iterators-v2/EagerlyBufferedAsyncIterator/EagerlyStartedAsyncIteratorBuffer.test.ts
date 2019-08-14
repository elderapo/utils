import { sleep } from "../../timers";

describe("EagerlyStartedAsyncIteratorBuffer", () => {
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

  describe("test helpers", () => {
    it("should work no delays", async () => {
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

    it("should work same delays", async () => {
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

    it("should work different delays", async () => {
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

    it("should throw error when set", async () => {
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

  //   it("aaa", () => {
  //     //
  //   });
});
