import { satoshiToBitcoin, bitcoinToSatoshi } from "./satoshiCalculator";

describe("satoshiCalculator", () => {
  describe("satoshiToBitcoin", () => {
    it("should work with strings", () => {
      expect(satoshiToBitcoin("100")).toBe(0.000001);
      expect(satoshiToBitcoin("123")).toBe(0.00000123);
      expect(satoshiToBitcoin("-123")).toBe(-0.00000123);

      expect(satoshiToBitcoin("100000100")).toBe(1.000001);
      expect(satoshiToBitcoin("100000123")).toBe(1.00000123);
      expect(satoshiToBitcoin("-100000123")).toBe(-1.00000123);

      expect(satoshiToBitcoin("123456789")).toBe(1.23456789);
    });

    it("should work with numbers", () => {
      expect(satoshiToBitcoin(100)).toBe(0.000001);
      expect(satoshiToBitcoin(123)).toBe(0.00000123);
      expect(satoshiToBitcoin(-123)).toBe(-0.00000123);

      expect(satoshiToBitcoin(100000100)).toBe(1.000001);
      expect(satoshiToBitcoin(100000123)).toBe(1.00000123);
      expect(satoshiToBitcoin(-100000123)).toBe(-1.00000123);

      expect(satoshiToBitcoin(123456789)).toBe(1.23456789);
    });

    it("should throw if skipIsIntCheck=false and provided float", () => {
      expect(() => satoshiToBitcoin(0.1)).toThrowError(TypeError);
    });

    it("should not throw if skipIsIntCheck=false and provided float", () => {
      expect(() => satoshiToBitcoin(0.1, true)).not.toThrowError(TypeError);

      expect(satoshiToBitcoin(0.1, true)).toBe(0.000000001);
    });
  });

  describe("bitcoinToSatoshi", () => {
    it("should work with strings", () => {
      expect(bitcoinToSatoshi("0.000001")).toBe(100);
      expect(bitcoinToSatoshi("0.00000123")).toBe(123);
      expect(bitcoinToSatoshi("-0.00000123")).toBe(-123);

      expect(bitcoinToSatoshi("1.000001")).toBe(100000100);
      expect(bitcoinToSatoshi("1.00000123")).toBe(100000123);
      expect(bitcoinToSatoshi("-1.00000123")).toBe(-100000123);

      expect(bitcoinToSatoshi("1.23456789")).toBe(123456789);
    });

    it("should work with numbers", () => {
      expect(bitcoinToSatoshi(0.000001)).toBe(100);
      expect(bitcoinToSatoshi(0.00000123)).toBe(123);
      expect(bitcoinToSatoshi(-0.00000123)).toBe(-123);

      expect(bitcoinToSatoshi(1.000001)).toBe(100000100);
      expect(bitcoinToSatoshi(1.00000123)).toBe(100000123);
      expect(bitcoinToSatoshi(-1.00000123)).toBe(-100000123);

      expect(bitcoinToSatoshi(1.23456789)).toBe(123456789);
    });
  });

  describe("additional checks", () => {
    expect(bitcoinToSatoshi(satoshiToBitcoin(-1))).toBe(-1);
    expect(bitcoinToSatoshi(satoshiToBitcoin(1231231))).toBe(1231231);
    expect(bitcoinToSatoshi(satoshiToBitcoin(1231231000000))).toBe(1231231000000);
    expect(bitcoinToSatoshi(satoshiToBitcoin(12))).toBe(12);
    expect(bitcoinToSatoshi(satoshiToBitcoin(60000001))).toBe(60000001);
  });
});
