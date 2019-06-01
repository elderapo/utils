import { limitMethod, RateExceededError } from "./limitMethod";

describe("limitMethod", () => {
  it("does not throw on different keys", () => {
    class Test1 {
      private i = 0;

      @limitMethod({
        calls: 1,
        timespan: 1000,
        getKeyFromArgs: args => args[0]
      })
      public someMethod(key: string) {
        return this.i++;
      }
    }

    const instance1 = new Test1();

    expect(instance1.someMethod("a")).toBe(0);
    expect(instance1.someMethod("b")).toBe(1);
    expect(instance1.someMethod("c")).toBe(2);
  });

  it("throws RateExceededError by default on exceed", () => {
    class Test1 {
      private i = 0;

      @limitMethod({
        calls: 1,
        timespan: 1000,
        getKeyFromArgs: args => args[0]
      })
      public someMethod(key: string) {
        return this.i++;
      }
    }

    const instance1 = new Test1();

    instance1.someMethod("a");
    expect(() => instance1.someMethod("a")).toThrowError(new RateExceededError());

    instance1.someMethod("b");
    expect(() => instance1.someMethod("b")).toThrowError(new RateExceededError());
  });
});
