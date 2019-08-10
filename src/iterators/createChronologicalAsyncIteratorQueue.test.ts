import { TestAsyncIterator } from "./TestAsyncIterator";
import { createChronologicalAsyncIteratorQueue } from "./createChronologicalAsyncIteratorQueue";

describe("createChronologicalAsyncIteratorQueue", () => {
  it("combining 1 non throwing iterator should work just fine", async () => {
    const it1 = new TestAsyncIterator({
      from: 0,
      to: 5,
      delay: 50,
      identifier: "AAA"
    });

    const combinedIT = createChronologicalAsyncIteratorQueue([it1]);

    const items: number[] = [];

    for await (const item of combinedIT) {
      items.push(item);
    }

    expect(items).toMatchInlineSnapshot(`
                  Array [
                    0,
                    1,
                    2,
                    3,
                    4,
                  ]
            `);
  });

  it("combining 2 non throwing iterators with same delays works", async () => {
    const it1 = new TestAsyncIterator({
      from: 0,
      to: 5,
      delay: 50,
      identifier: "AAA"
    });

    const it2 = new TestAsyncIterator({
      from: 5,
      to: 10,
      delay: 50,
      identifier: "BBB"
    });

    const combinedIT = createChronologicalAsyncIteratorQueue([it1, it2]);

    const items: number[] = [];

    for await (const item of combinedIT) {
      items.push(item);
    }

    expect(items).toMatchInlineSnapshot(`
                  Array [
                    0,
                    1,
                    2,
                    3,
                    4,
                    5,
                    6,
                    7,
                    8,
                    9,
                  ]
            `);
  });

  it("combining 2 non throwing iterators with different delays works (1)", async () => {
    const it1 = new TestAsyncIterator({
      from: 0,
      to: 5,
      delay: 25,
      identifier: "AAA"
    });

    const it2 = new TestAsyncIterator({
      from: 5,
      to: 10,
      delay: 50,
      identifier: "BBB"
    });

    const combinedIT = createChronologicalAsyncIteratorQueue([it1, it2]);

    const items: number[] = [];

    for await (const item of combinedIT) {
      items.push(item);
    }

    expect(items).toMatchInlineSnapshot(`
                  Array [
                    0,
                    1,
                    2,
                    3,
                    4,
                    5,
                    6,
                    7,
                    8,
                    9,
                  ]
            `);
  });

  it("combining 2 non throwing iterators with different delays works (2)", async () => {
    const it1 = new TestAsyncIterator({
      from: 0,
      to: 5,
      delay: 50,
      identifier: "AAA"
    });

    const it2 = new TestAsyncIterator({
      from: 5,
      to: 10,
      delay: 25,
      identifier: "BBB"
    });

    const combinedIT = createChronologicalAsyncIteratorQueue([it1, it2]);

    const items: number[] = [];

    for await (const item of combinedIT) {
      items.push(item);
    }

    expect(items).toMatchInlineSnapshot(`
                  Array [
                    0,
                    1,
                    2,
                    3,
                    4,
                    5,
                    6,
                    7,
                    8,
                    9,
                  ]
            `);
  });

  it("combining 2 non throwing iterators and first returns should work", async () => {
    const it1 = new TestAsyncIterator({
      from: 0,
      to: 5,
      delay: 50,
      identifier: "AAA"
    });

    const it2 = new TestAsyncIterator({
      from: 5,
      to: 10,
      delay: 50,
      identifier: "BBB"
    });

    const combinedIT = createChronologicalAsyncIteratorQueue([it1, it2]);

    const items: number[] = [];

    for await (const item of combinedIT) {
      items.push(item);
      if (item === 3) {
        return;
      }
    }

    for await (const item of combinedIT) {
      items.push(item);
    }

    expect(items).toMatchInlineSnapshot(`
                  Array [
                    0,
                    1,
                    2,
                  ]
            `);
  });

  it("combining 2 non throwing iterators and second returns should work", async () => {
    const it1 = new TestAsyncIterator({
      from: 0,
      to: 10,
      delay: 50,
      identifier: "AAA"
    });

    const it2 = new TestAsyncIterator({
      from: 10,
      to: 20,
      delay: 50,
      identifier: "BBB"
    });

    const combinedIT = createChronologicalAsyncIteratorQueue([it1, it2]);

    const items: number[] = [];

    for await (const item of combinedIT) {
      items.push(item);
      if (item === 13) {
        return;
      }
    }

    expect(items).toMatchInlineSnapshot(`
      Array [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
      ]
    `);
  });

  // it("does not accept empty createIterators array", async () => {
  //   const { createTestableAsyncIterator } = createAsyncIterablesTestSuite();

  //   expect(() => createChronologicalAsyncIteratorQueue([])).toThrow();
  // });

  // it("correctly works with single item", async () => {
  //   const { createTestableAsyncIterator } = createAsyncIterablesTestSuite();

  //   const combined = createChronologicalAsyncIteratorQueue([
  //     () => createTestableAsyncIterator(0, 10, 10, "AAA")
  //   ]);

  //   const values: number[] = [];

  //   for await (let a of createIterableFromIterator(combined)) {
  //     values.push(a);
  //   }

  //   expect(values).toMatchSnapshot();
  // });

  // it("chronologically yields values if first item is faster than second", async () => {
  //   const { createTestableAsyncIterator } = createAsyncIterablesTestSuite();

  //   const combined = createChronologicalAsyncIteratorQueue([
  //     () => createTestableAsyncIterator(0, 10, 20, "AAA"),
  //     () => createTestableAsyncIterator(10, 20, 23, "BBB")
  //   ]);

  //   const values: number[] = [];

  //   for await (let a of createIterableFromIterator(combined)) {
  //     values.push(a);
  //   }

  //   expect(values).toMatchSnapshot();
  // });

  // it("chronologically yields values if first item is slower than second", async () => {
  //   const { createTestableAsyncIterator } = createAsyncIterablesTestSuite();

  //   const combined = createChronologicalAsyncIteratorQueue([
  //     () => createTestableAsyncIterator(0, 10, 23, "AAA"),
  //     () => createTestableAsyncIterator(10, 20, 20, "BBB")
  //   ]);

  //   const values: number[] = [];

  //   for await (let a of createIterableFromIterator(combined)) {
  //     values.push(a);
  //   }

  //   expect(values).toMatchSnapshot();
  // });

  // it("chronologically yields values if first item is faster than second and there is a break somewhere in first item", async () => {
  //   const { createTestableAsyncIterator } = createAsyncIterablesTestSuite();

  //   const combined = createChronologicalAsyncIteratorQueue([
  //     () => createTestableAsyncIterator(0, 10, 20, "AAA"),
  //     () => createTestableAsyncIterator(10, 20, 23, "BBB")
  //   ]);

  //   const values: number[] = [];

  //   for await (let a of createIterableFromIterator(combined)) {
  //     values.push(a);

  //     if (a === 3) {
  //       break;
  //     }
  //   }

  //   expect(values).toMatchSnapshot();
  // });

  // it("chronologically yields values if first item is slower than second and there is a break somewhere in first item", async () => {
  //   const { createTestableAsyncIterator } = createAsyncIterablesTestSuite();

  //   const combined = createChronologicalAsyncIteratorQueue([
  //     () => createTestableAsyncIterator(0, 10, 23, "AAA"),
  //     () => createTestableAsyncIterator(10, 20, 20, "BBB")
  //   ]);

  //   const values: number[] = [];

  //   for await (let a of createIterableFromIterator(combined)) {
  //     values.push(a);

  //     if (a === 3) {
  //       break;
  //     }
  //   }

  //   expect(values).toMatchSnapshot();
  // });

  // it("chronologically yields values if first item is faster than second and there is a break somewhere in second item", async () => {
  //   const { createTestableAsyncIterator } = createAsyncIterablesTestSuite();

  //   const combined = createChronologicalAsyncIteratorQueue([
  //     () => createTestableAsyncIterator(0, 10, 20, "AAA"),
  //     () => createTestableAsyncIterator(10, 20, 23, "BBB")
  //   ]);

  //   const values: number[] = [];

  //   for await (let a of createIterableFromIterator(combined)) {
  //     values.push(a);

  //     if (a === 15) {
  //       break;
  //     }
  //   }

  //   expect(values).toMatchSnapshot();
  // });

  // it("chronologically yields values if first item is slower than second and there is a break somewhere in second item", async () => {
  //   const { createTestableAsyncIterator } = createAsyncIterablesTestSuite();

  //   const combined = createChronologicalAsyncIteratorQueue([
  //     () => createTestableAsyncIterator(0, 10, 23, "AAA"),
  //     () => createTestableAsyncIterator(10, 20, 20, "BBB")
  //   ]);

  //   const values: number[] = [];

  //   for await (let a of createIterableFromIterator(combined)) {
  //     values.push(a);

  //     if (a === 15) {
  //       break;
  //     }
  //   }

  //   expect(values).toMatchSnapshot();
  // });

  // it("correctly handles throw on first item(0 index)", async () => {
  //   const {
  //     createTestableAsyncIterator,
  //     createTestableAsyncIteratorThatThrowsAt,
  //     callResults
  //   } = createAsyncIterablesTestSuite();

  //   const combined = createChronologicalAsyncIteratorQueue([
  //     () => createTestableAsyncIteratorThatThrowsAt(0, 10, 10, 0, "AAA"),
  //     () => createTestableAsyncIterator(10, 20, 6, "BBB")
  //   ]);

  //   const values: number[] = [];

  //   await expectAsyncThrow(
  //     async () => {
  //       for await (let a of createIterableFromIterator(combined)) {
  //         values.push(a);
  //       }
  //     },
  //     [],
  //     new Error("REQUESTED_THROW_AAA_0")
  //   );

  //   // BBB should manage to execute before AAA but shouldn't be included in values
  //   expect(callResults[0]).toBe(
  //     '["next","BBB",{"start":10,"end":20,"current":10,"delay":6,"exhaused":false}]'
  //   );
  //   expect(values.length).toBe(0);
  // });

  // it("correctly handles throw on first item(3 index)", async () => {
  //   const {
  //     createTestableAsyncIterator,
  //     createTestableAsyncIteratorThatThrowsAt,
  //     callResults
  //   } = createAsyncIterablesTestSuite();

  //   const combined = createChronologicalAsyncIteratorQueue([
  //     () => createTestableAsyncIteratorThatThrowsAt(0, 10, 10, 3, "AAA"),
  //     () => createTestableAsyncIterator(10, 20, 15, "BBB")
  //   ]);

  //   const values: number[] = [];

  //   await expectAsyncThrow(
  //     async () => {
  //       for await (let a of createIterableFromIterator(combined)) {
  //         values.push(a);
  //       }
  //     },
  //     [],
  //     new Error("REQUESTED_THROW_AAA_3")
  //   );

  //   expect(values.length).toBeLessThanOrEqual(3);

  //   // because BBB should manage to execute at least 1 time
  //   expect(callResults[1]).toBe(
  //     '["next","BBB",{"start":10,"end":20,"current":10,"delay":15,"exhaused":false}]'
  //   );

  //   // but BBB result shouldn't be included in values because first iterator was interrupted
  //   expect(values.filter(v => v > 2).length).toBe(0);
  // });

  // it("correctly handles throw on second item(0 index)", async () => {
  //   const {
  //     createTestableAsyncIterator,
  //     createTestableAsyncIteratorThatThrowsAt,
  //     callResults
  //   } = createAsyncIterablesTestSuite();

  //   const combined = createChronologicalAsyncIteratorQueue([
  //     () => createTestableAsyncIterator(0, 10, 14, "AAA"),
  //     () => createTestableAsyncIteratorThatThrowsAt(10, 20, 50, 10 + 0, "BBB")
  //   ]);

  //   const values: number[] = [];

  //   await expectAsyncThrow(
  //     async () => {
  //       for await (let a of createIterableFromIterator(combined)) {
  //         values.push(a);
  //       }
  //     },
  //     [],
  //     new Error("REQUESTED_THROW_BBB_10")
  //   );

  //   expect(values.length).toBeLessThanOrEqual(4);
  //   expect(
  //     callResults.includes(
  //       '["throw","BBB",{"start":10,"end":20,"current":10,"delay":50,"exhaused":false}]'
  //     )
  //   ).toBeTruthy();
  //   // because it's impossible for values bigger to execute on time
  //   expect(values.filter(v => v > 3).length).toBe(0);
  // });

  // it("correctly handles throw on second item(2 index)", async () => {
  //   const {
  //     createTestableAsyncIterator,
  //     createTestableAsyncIteratorThatThrowsAt,
  //     callResults
  //   } = createAsyncIterablesTestSuite();

  //   const combined = createChronologicalAsyncIteratorQueue([
  //     () => createTestableAsyncIterator(0, 10, 10, "AAA"),
  //     () => createTestableAsyncIteratorThatThrowsAt(10, 20, 15, 10 + 2, "BBB")
  //   ]);

  //   const values: number[] = [];

  //   await expectAsyncThrow(
  //     async () => {
  //       for await (let a of createIterableFromIterator(combined)) {
  //         values.push(a);
  //       }
  //     },
  //     [],
  //     new Error("REQUESTED_THROW_BBB_12")
  //   );

  //   expect(values.length).toBeLessThanOrEqual(5);

  //   // // because it's impossible for values bigger to execute on time
  //   expect(values.filter(v => v > 4).length).toBe(0);
  // });

  // it("correctly handles throw on second item(3 index) - second item is faster than first", async () => {
  //   const {
  //     createTestableAsyncIterator,
  //     createTestableAsyncIteratorThatThrowsAt
  //   } = createAsyncIterablesTestSuite();

  //   const combined = createChronologicalAsyncIteratorQueue([
  //     () => createTestableAsyncIterator(0, 10, 20, "AAA"),
  //     () => createTestableAsyncIteratorThatThrowsAt(10, 20, 10, 10 + 3, "BBB")
  //   ]);

  //   const values: number[] = [];

  //   await expectAsyncThrow(
  //     async () => {
  //       for await (let a of createIterableFromIterator(combined)) {
  //         values.push(a);
  //       }
  //     },
  //     [],
  //     new Error("REQUESTED_THROW_BBB_13")
  //   );

  //   expect(values.length).toBeLessThanOrEqual(3);

  //   // because it's impossible for values bigger to execute on time
  //   expect(values.filter(v => v > 2).length).toBe(0);
  // });
});
