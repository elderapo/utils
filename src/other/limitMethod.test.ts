import { limitMethod } from "./limitMethod";

describe("limitMethod", () => {
  it("aaa", () => {
    class Test1 {
      private i = 0;

      @limitMethod({
        calls: 1,
        timespan: 1000,
        getKeyFromArgs: args => ""
      })
      someMethod(key: string) {
        return this.i++;
      }
    }
  });
});
