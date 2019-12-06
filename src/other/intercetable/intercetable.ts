import { IntercetableContext, IntercetableContextType } from "./IntercetableContext";

export interface IIntercetableOptions<
  T extends Object,
  K extends keyof T = keyof T,
  V extends T[K] = T[K]
> {
  set?: (target: T, key: K, value: V, isInternal: boolean) => boolean;
  get?: (target: T, key: K, suggestedValue: V, isInternal: boolean) => V;
}

export const interceptable = <
  C extends new (...args: any[]) => any,
  I extends InstanceType<C>,
  K extends keyof I,
  V extends I[K]
>(
  options: IIntercetableOptions<I> = {}
) => (OriginalClass: C) => {
  return new Proxy(OriginalClass, {
    construct(ProxiedClass: C, args: any) {
      /*
       * Option #1 is better but still not perfect. Binding arrow functions does not work
       * and additionally there is no 100% guaranteed method of checking if x function is
       * an arrow function.
       *
       * Option #2 sucks because it only works if es6 classes get transpiled to es3/es5
       */

      const original: I = new ProxiedClass(args); // Option #1 step 1

      // const original: I = Object.create(ProxiedClass.prototype); // # Option #2 step 1

      const onSet = (key: K, newValue: V, isInternal: boolean): boolean => {
        // @IDEA: Maybe just disallow setting functions as class properites?
        if (typeof newValue === "function") {
          throw new Error("Cannot set function as class property. Use methods instead!");
        }

        if (options.set) {
          return options.set(original, key, newValue, isInternal);
        }

        original[key] = newValue;
        return true;
      };

      const onGet = (key: K, isInternal: boolean): V => {
        const targetValue = original[key];

        const suggestedValue =
          // tslint:disable-next-line: strict-type-predicates
          typeof targetValue === "function" ? targetValue.bind(internalContext) : targetValue;

        if (options.get) {
          return options.get(original, key, suggestedValue, isInternal);
        }

        return suggestedValue;
      };

      // accessed by class methods
      const internalContext = new Proxy(original, {
        get: (target: I, key: K) => onGet(key, true),
        set: (target: I, key: K, value: V) => onSet(key, value, true)
      });

      // accessed by class instance consumers or w/e it's called
      const externalContext = new Proxy(original, {
        get: (target: I, key: K) => onGet(key, false),
        set: (target: I, key: K, value: V) => onSet(key, value, false)
      });

      IntercetableContext.setContextType(internalContext, IntercetableContextType.Internal);
      IntercetableContext.setContextType(externalContext, IntercetableContextType.External);

      // Option #1 step 2, @CAVEAT: symbols can "arrive" in different order.
      [...Object.getOwnPropertyNames(original), ...Object.getOwnPropertySymbols(original)].forEach(
        key => onSet(key as K, original[key], true)
      );

      // // Option #2 step 2
      // ProxiedClass.prototype.constructor.call(internalContext, args);

      return externalContext;
    }
  });
};
