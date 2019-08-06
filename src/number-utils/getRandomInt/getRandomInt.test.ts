import { getRandomInt } from "./getRandomInt";

describe("getRandomInt", () => {
  it("should return correct values", () => {
    for (let i = 0; i < 2000; i++) {
      expect(getRandomInt(0, 10)).toBeGreaterThanOrEqual(0);
      expect(getRandomInt(0, 10)).toBeLessThanOrEqual(10);
    }
  });
});
