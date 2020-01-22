import { range } from "./range";

describe("range", () => {
  it("should work", () => {
    expect(Array.from(range(0))).toMatchObject([]);

    expect(Array.from(range(0, 3))).toMatchObject([0, 1, 2]);
    expect(Array.from(range(-2, 3))).toMatchObject([-2, -1, 0, 1, 2]);
    expect(Array.from(range(4))).toMatchObject([0, 1, 2, 3]);

    expect(Array.from(range(-3))).toMatchObject([0, -1, -2]);
    expect(Array.from(range(-3, -3))).toMatchObject([]);
    expect(Array.from(range(3, -3))).toMatchObject([3, 2, 1, 0, -1, -2]);
  });
});
