import { TestAsyncIterator } from "./TestAsyncIterator";
import { sleep } from "../timers";
import { expectAsyncThrow } from "../test-utils";

describe("TestAsyncIterator", () => {
  it("works with for await loop", async () => {
    const it = new TestAsyncIterator({
      from: 0,
      to: 10,
      delay: 50,
      identifier: "AAA"
    });

    let values: number[] = [];

    for await (let item of it) {
      values.push(item);
    }

    expect(values).toMatchObject(
      Array(10)
        .fill(0)
        .map((_, index) => index)
    );

    expect(it.getState()).toMatchInlineSnapshot(`
      Object {
        "isSourceActive": false,
        "nextResolves": Array [
          [Function],
        ],
        "returned": true,
        "thrownException": null,
      }
    `);
  });

  it("works with sequencially awaited it.next()", async () => {
    const it = new TestAsyncIterator({
      from: 0,
      to: 3,
      delay: 50,
      identifier: "AAA"
    });

    await expect(it.next()).resolves.toMatchObject({
      value: 0,
      done: false
    });

    expect(it.getState()).toMatchInlineSnapshot(`
                  Object {
                    "isSourceActive": true,
                    "nextResolves": Array [],
                    "returned": false,
                    "thrownException": null,
                  }
            `);

    await expect(it.next()).resolves.toMatchObject({
      value: 1,
      done: false
    });

    expect(it.getState()).toMatchInlineSnapshot(`
                  Object {
                    "isSourceActive": true,
                    "nextResolves": Array [],
                    "returned": false,
                    "thrownException": null,
                  }
            `);

    await expect(it.next()).resolves.toMatchObject({
      value: 2,
      done: false
    });

    expect(it.getState()).toMatchInlineSnapshot(`
      Object {
        "isSourceActive": false,
        "nextResolves": Array [],
        "returned": true,
        "thrownException": null,
      }
    `);

    await expect(it.next()).resolves.toMatchObject({
      value: null,
      done: true
    });

    expect(it.getState()).toMatchInlineSnapshot(`
      Object {
        "isSourceActive": false,
        "nextResolves": Array [
          [Function],
        ],
        "returned": true,
        "thrownException": null,
      }
    `);
  });

  it("works with batched await Promise([...it.next()])", async () => {
    const it = new TestAsyncIterator({
      from: 0,
      to: 10,
      delay: 25,
      identifier: "AAA"
    });

    await Promise.all(
      Array(9)
        .fill(0)
        .map((_, index) =>
          expect(it.next()).resolves.toMatchObject({
            value: index,
            done: false
          })
        )
    );

    expect(it.getState()).toMatchInlineSnapshot(`
                  Object {
                    "isSourceActive": true,
                    "nextResolves": Array [],
                    "returned": false,
                    "thrownException": null,
                  }
            `);

    await sleep(500);

    expect(it.getState()).toMatchInlineSnapshot(`
      Object {
        "isSourceActive": false,
        "nextResolves": Array [],
        "returned": true,
        "thrownException": null,
      }
    `);

    await expect(it.next()).resolves.toMatchObject({
      value: null,
      done: true
    });
  });

  it("throws on throwAt", async () => {
    const it = new TestAsyncIterator({
      from: 0,
      to: 10,
      throwAt: 3,
      delay: 20,
      identifier: "AAA"
    });

    expectAsyncThrow(
      async () => {
        for await (const item of it) {
        }
      },
      [],
      new Error("REQUESTED_THROW_AAA_3")
    );

    await sleep(100);

    expect(it.getState()).toMatchInlineSnapshot(`
      Object {
        "isSourceActive": false,
        "nextResolves": Array [],
        "returned": true,
        "thrownException": [Error: REQUESTED_THROW_AAA_3],
      }
    `);
  });
});
