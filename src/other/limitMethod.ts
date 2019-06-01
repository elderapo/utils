import { CustomError } from "ts-custom-error";

export type GetKeyFromArgs = (...args: any[]) => string;
export type OnRateExceded = (
  args: any[],
  callsPerTimespan: number,
  lastTimestamps: number[]
) => never | Promise<never>;

export interface ILimitMethodOptions {
  calls: number;
  timespan: number;
  getKeyFromArgs: GetKeyFromArgs;
  onRateExceded?: OnRateExceded;
}

export class RateExceededError extends CustomError {}

export const limitMethod = ({
  calls,
  timespan,
  getKeyFromArgs,
  onRateExceded
}: ILimitMethodOptions) => {
  return (
    target: Object,
    key: string,
    descriptor = Object.getOwnPropertyDescriptor(target, key) as PropertyDescriptor
  ) => {
    const lastExecutionsMap = new Map<string, number[]>();
    const originalMethod = descriptor.value;

    // this has to be function and not an arrow function
    descriptor.value = function(...args: any[]) {
      const key = getKeyFromArgs(...args);

      if (!lastExecutionsMap.has(key)) {
        lastExecutionsMap.set(key, []);
      }

      const lastExecutions = lastExecutionsMap.get(key) as number[];

      let i = lastExecutions.length;

      while (i--) {
        const lastCallTime = lastExecutions[i];
        if (lastCallTime + timespan < Date.now()) {
          lastExecutions.splice(i, 1);
        }
      }

      if (lastExecutions.length >= calls) {
        if (onRateExceded) {
          return onRateExceded([...args], calls, lastExecutions);
        }

        throw new RateExceededError();
      }

      lastExecutions.push(Date.now());

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
};
