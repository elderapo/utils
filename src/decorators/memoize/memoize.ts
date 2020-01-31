/* istanbul ignore file */

export function memoize(hashFunction?: (...args: any[]) => any) {
  return (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => {
    if (descriptor.value != null) {
      descriptor.value = getNewFunction(descriptor.value, hashFunction);
    } else if (descriptor.get) {
      descriptor.get = getNewFunction(descriptor.get, hashFunction);
    } else {
      throw new Error("Only put a Memoize() decorator on a method or get accessor.");
    }
  };
}

let counter = 0;
function getNewFunction(originalMethod: () => void, hashFunction?: (...args: any[]) => any) {
  const identifier = ++counter;

  // The function returned here gets called instead of originalMethod.
  return function(...args: any[]) {
    const propValName = `__memoized_value_${identifier}`;
    const propMapName = `__memoized_map_${identifier}`;

    let returnedValue: any;

    // @ts-ignore
    const self: object = this;

    if (hashFunction || args.length > 0) {
      // Get or create map
      if (!self.hasOwnProperty(propMapName)) {
        Object.defineProperty(self, propMapName, {
          configurable: false,
          enumerable: false,
          writable: false,
          value: new Map<any, any>()
        });
      }
      // @ts-ignore
      let myMap: Map<any, any> = self[propMapName];

      let hashKey: any;

      if (hashFunction) {
        hashKey = hashFunction.apply(self, args);
      } else {
        hashKey = args[0];
      }

      if (myMap.has(hashKey)) {
        returnedValue = myMap.get(hashKey);
      } else {
        // @ts-ignore
        returnedValue = originalMethod.apply(self, args);
        myMap.set(hashKey, returnedValue);
      }
    } else {
      if (self.hasOwnProperty(propValName)) {
        // @ts-ignore
        returnedValue = self[propValName];
      } else {
        // @ts-ignore
        returnedValue = originalMethod.apply(self, args);
        Object.defineProperty(self, propValName, {
          configurable: false,
          enumerable: false,
          writable: false,
          value: returnedValue
        });
      }
    }

    return returnedValue;
  };
}
