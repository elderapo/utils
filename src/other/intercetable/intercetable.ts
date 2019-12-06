import { IntercetableContext, IntercetableContextType } from "./IntercetableContext";
import { isBindable } from "./isBindable";

export interface IIntercetableOptions<
  T extends Object,
  K extends keyof T = keyof T,
  V extends T[K] = T[K]
> {
  set?: (target: T, key: K, value: V, isInternal: boolean) => boolean;
  get?: (target: T, key: K, suggestedValue: V, isInternal: boolean) => V;
}

export type IntercetableReturnValue<T extends Object> = any;

export const interceptable = <
  C extends new (...args: any[]) => any,
  I extends InstanceType<C>,
  K extends keyof I,
  V extends I[K]
>(
  options: IIntercetableOptions<I> = {}
): IntercetableReturnValue<C> => (OriginalClass: C) => {
  return new Proxy(OriginalClass, {
    construct(ProxiedClass: C, args: any) {
      const original: I = new ProxiedClass(args);
      // const original: I = Object.create(ProxiedClass.prototype);

      const onSet = (key: K, newValue: V, isInternal: boolean): boolean => {
        if (typeof newValue === "function") {
          console.log("isBindable", key, isBindable(newValue));
          // newValue = newValue.bind(original);
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

      // @CAVEAT: symbols can "arrive" in different order.
      [...Object.getOwnPropertyNames(original), ...Object.getOwnPropertySymbols(original)].forEach(
        key => onSet(key as K, original[key], true)
      );

      // ProxiedClass.prototype.constructor.call(original, args);

      return externalContext;
    }
  });
};
