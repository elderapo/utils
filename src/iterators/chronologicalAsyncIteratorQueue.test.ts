import { createAsyncIterablesTestSuite } from "./testUtils";
import { chronologicalAsyncIteratorQueue } from "./chronologicalAsyncIteratorQueue";
import { createIterableFromIterator } from "./createIterableFromIterator";
import { sleep } from "../timers";
import { expectAsyncThrow } from "../test-utils";

describe("chronologicalAsyncIteratorQueue", () => {
  it("correctly works with single item", async () => {
    const { createTestableAsyncIterator } = createAsyncIterablesTestSuite();

    const combined = chronologicalAsyncIteratorQueue([
      () => createTestableAsyncIterator(0, 10, 10, "AAA")
    ]);

    const values: number[] = [];

    for await (let a of createIterableFromIterator(combined)) {
      values.push(a);
    }

    expect(values).toMatchSnapshot();
  });

  it("chronologically yields values if first item is faster than second", async () => {
    const { createTestableAsyncIterator } = createAsyncIterablesTestSuite();

    const combined = chronologicalAsyncIteratorQueue([
      () => createTestableAsyncIterator(0, 10, 20, "AAA"),
      () => createTestableAsyncIterator(10, 20, 23, "BBB")
    ]);

    const values: number[] = [];

    for await (let a of createIterableFromIterator(combined)) {
      values.push(a);
    }

    expect(values).toMatchSnapshot();
  });

  it("chronologically yields values if first item is slower than second", async () => {
    const { createTestableAsyncIterator } = createAsyncIterablesTestSuite();

    const combined = chronologicalAsyncIteratorQueue([
      () => createTestableAsyncIterator(0, 10, 23, "AAA"),
      () => createTestableAsyncIterator(10, 20, 20, "BBB")
    ]);

    const values: number[] = [];

    for await (let a of createIterableFromIterator(combined)) {
      values.push(a);
    }

    expect(values).toMatchSnapshot();
  });

  it("chronologically yields values if first item is faster than second and there is a break somewhere in first item", async () => {
    const { createTestableAsyncIterator } = createAsyncIterablesTestSuite();

    const combined = chronologicalAsyncIteratorQueue([
      () => createTestableAsyncIterator(0, 10, 20, "AAA"),
      () => createTestableAsyncIterator(10, 20, 23, "BBB")
    ]);

    const values: number[] = [];

    for await (let a of createIterableFromIterator(combined)) {
      values.push(a);

      if (a === 3) {
        break;
      }
    }

    expect(values).toMatchSnapshot();
  });

  it("chronologically yields values if first item is slower than second and there is a break somewhere in first item", async () => {
    const { createTestableAsyncIterator } = createAsyncIterablesTestSuite();

    const combined = chronologicalAsyncIteratorQueue([
      () => createTestableAsyncIterator(0, 10, 23, "AAA"),
      () => createTestableAsyncIterator(10, 20, 20, "BBB")
    ]);

    const values: number[] = [];

    for await (let a of createIterableFromIterator(combined)) {
      values.push(a);

      if (a === 3) {
        break;
      }
    }

    expect(values).toMatchSnapshot();
  });

  it("chronologically yields values if first item is faster than second and there is a break somewhere in second item", async () => {
    const { createTestableAsyncIterator } = createAsyncIterablesTestSuite();

    const combined = chronologicalAsyncIteratorQueue([
      () => createTestableAsyncIterator(0, 10, 20, "AAA"),
      () => createTestableAsyncIterator(10, 20, 23, "BBB")
    ]);

    const values: number[] = [];

    for await (let a of createIterableFromIterator(combined)) {
      values.push(a);

      if (a === 15) {
        break;
      }
    }

    expect(values).toMatchSnapshot();
  });

  it("chronologically yields values if first item is slower than second and there is a break somewhere in second item", async () => {
    const { createTestableAsyncIterator } = createAsyncIterablesTestSuite();

    const combined = chronologicalAsyncIteratorQueue([
      () => createTestableAsyncIterator(0, 10, 23, "AAA"),
      () => createTestableAsyncIterator(10, 20, 20, "BBB")
    ]);

    const values: number[] = [];

    for await (let a of createIterableFromIterator(combined)) {
      values.push(a);

      if (a === 15) {
        break;
      }
    }

    expect(values).toMatchSnapshot();
  });

  it("correctly handles throw on first item(0 index)", async () => {
    const {
      createTestableAsyncIterator,
      createTestableAsyncIteratorThatThrowsAt
    } = createAsyncIterablesTestSuite();

    const combined = chronologicalAsyncIteratorQueue([
      () => createTestableAsyncIteratorThatThrowsAt(0, 10, 10, 0, "AAA"),
      () => createTestableAsyncIterator(10, 20, 50, "BBB")
    ]);

    const values: number[] = [];

    await expectAsyncThrow(
      async () => {
        for await (let a of createIterableFromIterator(combined)) {
          values.push(a);
        }
      },
      [],
      new Error("REQUESTED_THROW_AAA_0")
    );

    expect(values).toMatchSnapshot();
  });

  it("correctly handles throw on first item(3 index)", async () => {
    const {
      createTestableAsyncIterator,
      createTestableAsyncIteratorThatThrowsAt
    } = createAsyncIterablesTestSuite();

    const combined = chronologicalAsyncIteratorQueue([
      () => createTestableAsyncIteratorThatThrowsAt(0, 10, 10, 3, "AAA"),
      () => createTestableAsyncIterator(10, 20, 50, "BBB")
    ]);

    const values: number[] = [];

    await expectAsyncThrow(
      async () => {
        for await (let a of createIterableFromIterator(combined)) {
          values.push(a);
        }
      },
      [],
      new Error("REQUESTED_THROW_AAA_3")
    );

    expect(values).toMatchSnapshot();
  });

  it("correctly handles throw on second item(0 index)", async () => {
    const {
      createTestableAsyncIterator,
      createTestableAsyncIteratorThatThrowsAt,
      callResults
    } = createAsyncIterablesTestSuite();

    const combined = chronologicalAsyncIteratorQueue([
      () => createTestableAsyncIterator(0, 10, 10, "AAA"),
      () => createTestableAsyncIteratorThatThrowsAt(10, 20, 50, 10 + 0, "BBB")
    ]);

    const values: number[] = [];

    await expectAsyncThrow(
      async () => {
        for await (let a of createIterableFromIterator(combined)) {
          values.push(a);
        }
      },
      [],
      new Error("REQUESTED_THROW_BBB_10")
    );

    try {
      for await (let a of createIterableFromIterator(combined)) {
        values.push(a);
      }
    } catch (ex) {}

    expect(values).toMatchSnapshot();
  });

  it("correctly handles throw on second item(3 index)", async () => {
    const {
      createTestableAsyncIterator,
      createTestableAsyncIteratorThatThrowsAt
    } = createAsyncIterablesTestSuite();

    const combined = chronologicalAsyncIteratorQueue([
      () => createTestableAsyncIterator(0, 10, 10, "AAA"),
      () => createTestableAsyncIteratorThatThrowsAt(10, 20, 50, 10 + 3, "BBB")
    ]);

    const values: number[] = [];

    await expectAsyncThrow(
      async () => {
        for await (let a of createIterableFromIterator(combined)) {
          values.push(a);
        }
      },
      [],
      new Error("REQUESTED_THROW_BBB_13")
    );

    expect(values).toMatchSnapshot();
  });
});
