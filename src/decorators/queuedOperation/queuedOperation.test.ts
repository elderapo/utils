import { sleep, waitImmediate } from "../../timers";
import { queuedOperation, createOperationQueue } from "./queuedOperation";
import { expectAsyncThrow } from "../../test-utils";

describe("queuedOperation", () => {
  it("uses instance method separate queue by default", async () => {
    class TestClass {
      public state: number = 0;

      @queuedOperation()
      public async someMethod1() {
        await sleep(100);
        return this.state++;
      }

      @queuedOperation()
      public async someMethod2() {
        await sleep(200);
        return this.state++;
      }
    }

    const instance = new TestClass();

    expect(instance.state).toBe(0);

    const before = Date.now();
    const results = await Promise.all([instance.someMethod1(), instance.someMethod2()]);
    const after = Date.now();

    expect(results).toMatchInlineSnapshot(
      [0, 1],
      `
            Object {
              "0": 0,
              "1": 1,
            }
        `
    );
    expect(after - before).toBeLessThanOrEqual(300);
  });

  it("shared queue works", async () => {
    const q = createOperationQueue();

    class TestClass {
      public state: number = 0;

      @queuedOperation(() => q)
      public async someMethod1() {
        await sleep(300);
        return this.state++;
      }

      @queuedOperation(() => q)
      public async someMethod2() {
        await sleep(200);
        return this.state++;
      }

      @queuedOperation(() => q)
      public async someMethod3() {
        await sleep(100);
        return this.state++;
      }
    }

    const instance = new TestClass();

    expect(instance.state).toBe(0);

    const before = Date.now();
    const results = await Promise.all([
      instance.someMethod1(),
      instance.someMethod2(),
      instance.someMethod3()
    ]);
    const after = Date.now();

    expect(results).toMatchInlineSnapshot(
      [0, 1, 2],
      `
      Object {
        "0": 0,
        "1": 1,
        "2": 2,
      }
    `
    );
    expect(after - before).toBeGreaterThan(600);
  });

  it("100 calls 10ms each take little bit more than 1 second", async () => {
    class TestClass {
      public state: number = 0;

      @queuedOperation()
      public async someMethod1() {
        await sleep(10);
        return this.state++;
      }
    }

    const instance = new TestClass();

    expect(instance.state).toBe(0);

    const before = Date.now();
    const results = await Promise.all(
      Array(100)
        .fill(0)
        .map(() => instance.someMethod1())
    );
    const after = Date.now();

    expect(results).toMatchSnapshot();
    expect(after - before).toBeGreaterThan(100 * 10);
  });

  it("ensures that next call is started after previous is done (with waitImmediate delays)", async () => {
    class TestClass {
      public state: number = 0;

      @queuedOperation()
      public async someMethod() {
        await waitImmediate();
        return this.state++;
      }
    }

    const testTimes = 10;

    const instance = new TestClass();

    expect(instance.state).toBe(0);
    const promises = Array(testTimes)
      .fill(0)
      .map(() => instance.someMethod());
    expect(instance.state).toBe(0);

    for (let promise of promises) {
      const index = promises.indexOf(promise);
      expect(instance.state).toBe(index);
      expect(await promises[index]).toBe(index);
      expect(instance.state).toBe(index + 1);
    }
  });

  const testThrowScenario = async (delayFunc: (() => Promise<void>) | null) => {
    class TestClass {
      public state: number = 0;

      @queuedOperation()
      public async someMethod(shouldThrow: boolean) {
        if (delayFunc) {
          await delayFunc();
        }

        if (shouldThrow) {
          throw new Error(`REQUESTED_ERROR_${this.state}`);
        }

        return this.state++;
      }
    }

    const instance = new TestClass();

    expect(instance.state).toBe(0);
    // tslint:disable-next-line
    instance.someMethod(false);
    expect(instance.state).toBe(0);

    await expectAsyncThrow(() => instance.someMethod(true), [], new Error(`REQUESTED_ERROR_1`));

    // because first call resolves
    expect(instance.state).toBe(1);

    await instance.someMethod(false);
    expect(instance.state).toBe(2);

    await expectAsyncThrow(() => instance.someMethod(true), [], new Error(`REQUESTED_ERROR_2`));
    await expectAsyncThrow(() => instance.someMethod(true), [], new Error(`REQUESTED_ERROR_2`));

    expect(instance.state).toBe(2);
  };

  it("normally throws (setImmediate)", async () => {
    await testThrowScenario(() => waitImmediate());
  });

  it("normally throws (sleep small delay)", async () => {
    await testThrowScenario(() => sleep(100));
  });

  it("normally throws (no delay func)", async () => {
    await testThrowScenario(null);
  });
});
