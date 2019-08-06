import { noop } from "./noop";

describe("noop", () => {
  it("should be typeof function", () => {
    expect(typeof noop).toBe("function");
  });

  it("should return undefined", () => {
    expect(noop()).toBe(undefined);
  });
});
