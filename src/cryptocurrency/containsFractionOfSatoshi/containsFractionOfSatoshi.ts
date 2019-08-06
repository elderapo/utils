export const containsFractionOfSatoshi = (amount: number): boolean =>
  Math.floor(amount * 100_000_000) / 100_000_000 !== amount;
