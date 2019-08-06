import { fixDecimalPlaces } from "./fixDecimalPlaces";

describe("fixDecimalPlaces", () => {
  it("should work", () => {
    expect(fixDecimalPlaces(1, 5)).toBe(1);
    expect(fixDecimalPlaces(1.12345, 5)).toBe(1.12345);
    expect(fixDecimalPlaces(100, 5)).toBe(100);
    expect(fixDecimalPlaces(-100, 5)).toBe(-100);

    expect(fixDecimalPlaces(1.123451, 5)).toBe(1.12345);
    expect(fixDecimalPlaces(1.1234501, 5)).toBe(1.12345);
    expect(fixDecimalPlaces(1.123452, 5)).toBe(1.12345);
    expect(fixDecimalPlaces(1.123453, 5)).toBe(1.12345);
    expect(fixDecimalPlaces(1.123454, 5)).toBe(1.12345);
    expect(fixDecimalPlaces(1.123455, 5)).toBe(1.12345);
    expect(fixDecimalPlaces(1.123456, 5)).toBe(1.12345);
    expect(fixDecimalPlaces(1.123457, 5)).toBe(1.12345);
    expect(fixDecimalPlaces(1.123458, 5)).toBe(1.12345);
    expect(fixDecimalPlaces(1.123459, 5)).toBe(1.12345);

    expect(fixDecimalPlaces(1.12346, 5)).toBe(1.12346);
    expect(fixDecimalPlaces(1.12347, 5)).toBe(1.12347);

    expect(fixDecimalPlaces(1.111111, 5)).toBe(1.11111);
    expect(fixDecimalPlaces(1.1111, 5)).toBe(1.1111);

    expect(fixDecimalPlaces(1.000001, 5)).toBe(1);

    expect(fixDecimalPlaces(0.000000000000000000001, 5)).toBe(0);

    expect(fixDecimalPlaces(0.000000001, 5)).toBe(0);
    expect(fixDecimalPlaces(0.000000001, 8)).toBe(0);
    expect(fixDecimalPlaces(0.000000001, 9)).toBe(0.000000001);

    expect(fixDecimalPlaces(0.00000000000000000000000123, 26)).toBe(0.00000000000000000000000123);
  });
});
