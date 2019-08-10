import { InfiniteCapacityBuffer } from "./InfiniteCapacityBuffer";

describe("InfiniteCapacityBuffer", () => {
  it("should work lol", () => {
    const buffer = new InfiniteCapacityBuffer<number>();

    expect(buffer.empty).toBe(true);
    expect(buffer.full).toBe(false);

    expect(() => buffer.add(1)).not.toThrow();
    expect(() => buffer.add(2)).not.toThrow();
    expect(() => buffer.add(3)).not.toThrow();

    expect(buffer.empty).toBe(false);
    expect(buffer.full).toBe(false);

    expect(() => buffer.remove()).not.toThrowError();
    expect(() => buffer.remove()).not.toThrowError();
    expect(() => buffer.remove()).not.toThrowError();
    expect(() => buffer.remove()).toThrowError();
  });
});
