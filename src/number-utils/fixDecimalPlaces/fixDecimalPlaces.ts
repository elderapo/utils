import * as math from "mathjs";

export const fixDecimalPlaces = (n: number, decimalPlaces: number): number => {
  const precision = Math.pow(10, decimalPlaces);

  return math.divide(math.floor(math.multiply(n, precision)), precision);
};
