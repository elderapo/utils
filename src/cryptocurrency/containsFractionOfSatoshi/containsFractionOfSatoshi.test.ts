import { containsFractionOfSatoshi } from "./containsFractionOfSatoshi";

describe("containsFractionOfSatoshi", () => {
  it("should work...", () => {
    expect(containsFractionOfSatoshi(1)).toBe(false);
    expect(containsFractionOfSatoshi(0)).toBe(false);
    expect(containsFractionOfSatoshi(-0)).toBe(false);
    expect(containsFractionOfSatoshi(-1)).toBe(false);

    expect(containsFractionOfSatoshi(0.1)).toBe(false);
    expect(containsFractionOfSatoshi(0.0)).toBe(false);
    expect(containsFractionOfSatoshi(-0.0)).toBe(false);
    expect(containsFractionOfSatoshi(-0.1)).toBe(false);

    expect(containsFractionOfSatoshi(0.00000001)).toBe(false);
    expect(containsFractionOfSatoshi(-0.00000001)).toBe(false);

    expect(containsFractionOfSatoshi(0.12345678)).toBe(false);
    expect(containsFractionOfSatoshi(-0.12345678)).toBe(false);

    expect(containsFractionOfSatoshi(0.000000001)).toBe(true);
    expect(containsFractionOfSatoshi(-0.000000001)).toBe(true);

    expect(containsFractionOfSatoshi(0.000000000123)).toBe(true);
    expect(containsFractionOfSatoshi(-0.000000000123)).toBe(true);

    expect(containsFractionOfSatoshi(0.3 - 0.1)).toBe(true);

    expect(containsFractionOfSatoshi(0.123456789)).toBe(true);
    expect(containsFractionOfSatoshi(-0.123456789)).toBe(true);
  });
});
