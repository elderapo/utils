export type GetKeyFromArgs = (...args: any[]) => any;
export type OnRateExceded = (
  args: any[],
  callsPerTimespan: number,
  lastTimestamps: number[]
) => Promise<void>;

export interface ILimitMethodOptions {
  calls: number;
  timespan: number;
  getKeyFromArgs: GetKeyFromArgs;
  onRateExceded?: OnRateExceded;
}

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
    const lastExecutionsMap = new Map<any, number[]>();
    const originalMethod = descriptor.value;

    // this has to be function and not an arrow function
    descriptor.value = async function(...args: any[]) {
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
        return;
      }

      lastExecutions.push(Date.now());

      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
};
