import { InterceptableContext } from "./InterceptableContext";

export interface IInterceptableOptions<
  T extends Object,
  K extends keyof T = keyof T,
  V extends T[K] = T[K]
> {
  afterConstruct?: (original: T) => void;

  set?: (original: T, key: K, value: V, isInternal: boolean) => void;
  get?: (original: T, key: K, suggestedValue: V, isInternal: boolean) => V;

  defineProperty?: (original: T, p: K, descriptor: PropertyDescriptor, isInternal: boolean) => void;
  deleteProperty?: (original: T, p: K, isInternal: boolean) => void;

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
  _options: IInterceptableOptions<I>
) => (OriginalClass: C): C => {
  const options = Object.assign({}, defaultInterceptableOptions, _options);

  const Interceptable = class extends OriginalClass {
    constructor(...args: any[]) {
      super(...args);

      if (this.constructor !== Interceptable) {
        // this class is inherited and options should be skipped for parent!
        return;
      }

      const original: I = this as any;

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
          // If there is set handler it should decide if value should be set or not.
          options.set(original, key, newValue, isInternal);
          return true;
        }

        // By default just update value.
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

      const onDefineProperty = (
        key: K,
        descriptor: PropertyDescriptor,
        isInternal: boolean
      ): boolean => {
        if (options.defineProperty) {
          options.defineProperty(original, key, descriptor, isInternal);
          return true;
        }

        Object.defineProperty(original, key, descriptor);
        return true;
      };

      const onDeleteProperty = (key: K, isInternal: boolean): boolean => {
        if (options.deleteProperty) {
          options.deleteProperty(original, key, isInternal);
          return true;
        }

        delete original[key];
        return true;
      };

      // accessed by class methods
      const internalContext = new Proxy(original, {
        get: (target: I, key: K) => onGet(key, true),
        set: (target: I, key: K, value: V) => onSet(key, value, true),
        defineProperty: (target: I, key: K, descriptor: PropertyDescriptor) =>
          onDefineProperty(key, descriptor, true),
        deleteProperty: (target: I, key: K) => onDeleteProperty(key, true)
      });

      // accessed by class instance consumers or w/e it's called
      const externalContext = new Proxy(original, {
        get: (target: I, key: K) => onGet(key, false),
        set: (target: I, key: K, value: V) => onSet(key, value, false),
        defineProperty: (target: I, key: K, descriptor: PropertyDescriptor) =>
          onDefineProperty(key, descriptor, false),
        deleteProperty: (target: I, key: K) => onDeleteProperty(key, false)
      });

      InterceptableContext.setupContexts(original, internalContext, externalContext);

      if (options.afterConstruct) {
        options.afterConstruct(original);
      }

      [
        ...Object.getOwnPropertyNames(original),
        ...Object.getOwnPropertySymbols(original)
      ].forEach(key => onSet(key as K, original[key], true));

      const descriptors = Object.getOwnPropertyDescriptors(OriginalClass.prototype);
      Object.keys(descriptors).forEach(key => {
        const value = descriptors[key];

        const objectPropertyDescriptor = Object.getOwnPropertyDescriptor(Object.prototype, key);

        if (objectPropertyDescriptor) {
          // For example constructor. Not sure if this is required for lets leave it here for now.
          return;
        }

        onDefineProperty(key as K, value, true);
      });

      return externalContext;
    }
  };
  Object.defineProperty(Interceptable, "name", { value: OriginalClass.name });

  return Interceptable;
};
