import { InterceptableContext, InterceptableContextType } from "./InterceptableContext";

export interface IInterceptableOptions<
  T extends Object,
  K extends keyof T = keyof T,
  V extends T[K] = T[K]
> {
  set?: (original: T, key: K, value: V, isInternal: boolean) => boolean;
  get?: (original: T, key: K, suggestedValue: V, isInternal: boolean) => V;
  afterConstruct?: (original: T) => void;
  allowDynamicFunctionAssigments?: boolean;
}

const defaultInterceptableOptions = {
  allowDynamicFunctionAssigments: false
};

export const interceptable = <
  C extends new (...args: any[]) => any,
  I extends InstanceType<C>,
  K extends keyof I,
  V extends I[K]
>(
  _options: IInterceptableOptions<I> = {}
) => (OriginalClass: C) => {
  const options = Object.assign({}, defaultInterceptableOptions, _options);

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
        if (typeof newValue === "function") {
          if (isInternal) {
            throw new Error("Function class properties are not allowed. Use methods instead!");
          }

          if (!options.allowDynamicFunctionAssigments) {
            throw new Error(
              `Assigning functions as class properties is not allowed by default. You can enable it with "allowDynamicFunctionAssigments".`
            );
          }
        }

        if (options.set) {
          return options.set(original, key, newValue, isInternal);
        }

        original[key] = newValue;
        return true;
      };

      const onGet = (key: K, isInternal: boolean): V => {
        const targetValue = original[key];

        const isMethod =
          // tslint:disable-next-line: strict-type-predicates
          typeof original[key] === "function" &&
          typeof original?.constructor?.prototype?.[key] === "function";

        const suggestedValue = isMethod ? targetValue.bind(internalContext) : targetValue;

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

      InterceptableContext.setupContexts(original, internalContext, externalContext);

      // Option #1 step 2, @CAVEAT: symbols can "arrive" in different order.
      [
        ...Object.getOwnPropertyNames(original),
        ...Object.getOwnPropertySymbols(original)
      ].forEach(key => onSet(key as K, original[key], true));

      // // Option #2 step 2
      // ProxiedClass.prototype.constructor.call(internalContext, args);

      if (options.afterConstruct) {
        options.afterConstruct(original);
      }

      return externalContext;
    }
  });
};
