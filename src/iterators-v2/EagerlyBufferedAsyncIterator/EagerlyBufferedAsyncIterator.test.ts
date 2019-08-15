import { sleep } from "../../timers";
import { comsumeAsyncIterator, createTestAsyncIterator } from "../iterator-test-helpers";
import { EagerlyBufferedAsyncIterator } from "./EagerlyBufferedAsyncIterator";

describe("EagerlyBufferedAsyncIterator", () => {
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

    await expect(comsumeAsyncIterator(eager)).resolves.toMatchObject([0, 1, 2]);
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

    await expect(comsumeAsyncIterator(eager)).resolves.toMatchObject([0, 1, 2]);
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

    await expect(comsumeAsyncIterator(eager)).resolves.toMatchObject([0, 1, 2]);
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

    await expect(comsumeAsyncIterator(eager)).resolves.toMatchObject([0, 1, 2]);
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

    await expect(comsumeAsyncIterator(eager)).resolves.toMatchObject([0, 1, 2]);
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

    await expect(comsumeAsyncIterator(eager)).resolves.toMatchObject([]);
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

    await expect(comsumeAsyncIterator(eager)).resolves.toMatchObject([
      0,
      new Error("CREATOR_THROWING::1")
    ]);
  });
});
