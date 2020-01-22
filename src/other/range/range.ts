/**
 * Iterates from 0 to end (exclusive).
 */
export function range(end: number): Iterable<number>;

/**
 * Iterates from start (inclusive) to end (exclusive).
 */
// tslint:disable:unified-signatures
export function range(start: number, end: number): Iterable<number>;

export function* range(arg0: number, arg1?: number): Iterable<number> {
  const start = typeof arg1 === "undefined" ? 0 : arg0;
  const end = typeof arg1 === "undefined" ? arg0 : arg1;

  const step = start < end ? +1 : -1;

  for (let i = start; step === -1 ? i > end : end > i; i += step) {
    yield i;
  }
}
