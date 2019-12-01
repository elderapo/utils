type UnwrapPromise<P> = P extends Promise<infer T> ? T : never;

type StringToNumberMap = readonly [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
type StringToNumber<T> = T extends keyof StringToNumberMap ? StringToNumberMap[T] : never;

export type PromiseRaceResult<T> = {
  [K in keyof T]: { readonly wonIndex: StringToNumber<K>; readonly value: UnwrapPromise<T[K]> }
};

export const promiseRaceIndex = async <T extends readonly Promise<any>[]>(
  promises: T
): Promise<PromiseRaceResult<T>[number]> => {
  return Promise.race(
    promises.map((original, index) => {
      return new Promise<PromiseRaceResult<T>[number]>(async (resolve, reject) => {
        try {
          const value = await original;
          return resolve({ wonIndex: index, value } as any);
        } catch (ex) {
          return reject(ex);
        }
      });
    })
  );
};
