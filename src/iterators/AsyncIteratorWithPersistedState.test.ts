import { TestAsyncIterator } from "./TestAsyncIterator";
import { AsyncIteratorWithPersistedState } from "./AsyncIteratorWithPersistedState";
import { expectAsyncThrow } from "../test-utils";
import { sleep } from "../timers";

describe("AsyncIteratorWithPersistedState", () => {
  it("works fine with instant iteration", async () => {
    const testIterator = new TestAsyncIterator({
      from: 0,
      to: 5,
      delay: 10,
      identifier: "AAA"
    });

    const testIteratorWithPersistedState = new AsyncIteratorWithPersistedState(testIterator);

    const values: number[] = [];

    for await (const val of testIteratorWithPersistedState) {
      values.push(val);
    }

    expect(values).toMatchInlineSnapshot(`
                  Array [
                    0,
                    1,
                    2,
                    3,
                    4,
                  ]
            `);
  });

  it("works fine with delayed iteration", async () => {
    const testIterator = new TestAsyncIterator({
      from: 0,
      to: 5,
      delay: 10,
      identifier: "AAA"
    });

    const testIteratorWithPersistedState = new AsyncIteratorWithPersistedState(testIterator);

    await sleep(500);

    const values: number[] = [];

    for await (const val of testIteratorWithPersistedState) {
      values.push(val);
    }

    expect(values).toMatchInlineSnapshot(`
                  Array [
                    0,
                    1,
                    2,
                    3,
                    4,
                  ]
            `);
  });

  it("works fine with delayed iteration multiple times", async () => {
    const testIterator = new TestAsyncIterator({
      from: 0,
      to: 20,
      delay: 10,
      identifier: "AAA"
    });

    const testIteratorWithPersistedState = new AsyncIteratorWithPersistedState(testIterator);

    await sleep(50);

    const values: number[] = [];

    for await (const val of testIteratorWithPersistedState) {
      values.push(val);

      if (val === 10) {
        await sleep(50);
      }
    }

    expect(values).toMatchInlineSnapshot(`
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
        13,
        14,
        15,
        16,
        17,
        18,
        19,
      ]
    `);
  });

  it("works fine with instant iteration that throws", async () => {
    const testIterator = new TestAsyncIterator({
      from: 0,
      to: 5,
      throwAt: 3,
      delay: 10,
      identifier: "AAA"
    });

    const testIteratorWithPersistedState = new AsyncIteratorWithPersistedState(testIterator);

    const values: number[] = [];

    expectAsyncThrow(
      async () => {
        for await (const val of testIteratorWithPersistedState) {
          values.push(val);
        }
      },
      [],
      new Error("REQUESTED_THROW_AAA_3")
    );

    expect(values).toMatchInlineSnapshot(`Array []`);
  });

  it("works fine with delayed iteration that throws", async () => {
    const testIterator = new TestAsyncIterator({
      from: 0,
      to: 5,
      throwAt: 3,
      delay: 10,
      identifier: "AAA"
    });

    const testIteratorWithPersistedState = new AsyncIteratorWithPersistedState(testIterator);

    await sleep(500);

    const values: number[] = [];

    expectAsyncThrow(
      async () => {
        for await (const val of testIteratorWithPersistedState) {
          values.push(val);
        }
      },
      [],
      new Error("REQUESTED_THROW_AAA_3")
    );

    expect(values).toMatchInlineSnapshot(`Array []`);
  });
});
