import { DependencyPath, DEPENDENCY_PATH_SYMBOL, INamespaceItem } from "./DependencyPath";

export const getNamespacesList = (instance: Object): INamespaceItem[] => {
  const dependencyPath: DependencyPath = (instance as any)[DEPENDENCY_PATH_SYMBOL];

  if (!dependencyPath) {
    throw new Error(
      `Cannot get namespace list for object(${instance}) because it hasn't been decorated with "useDependencyPathInstance"!`
    );
  }

  return dependencyPath["getNamespacesList"]();
};

export const useDependencyPathInstance = (target: any) => {
  // save a reference to the original constructor
  const original = target;

  // a utility function to generate instances of a class
  function construct(constructor: any, args: any) {
    const Cstr: any = function() {
      // @ts-ignore
      return new constructor(this, args);
    };
    Cstr.prototype = constructor.prototype;
    return new Cstr();
  }

  // the new constructor behaviour

  // @ts-ignore
  const f: any = function(...args) {
    const instance = construct(original, args);

    if (instance[DEPENDENCY_PATH_SYMBOL]) {
      throw new Error(
        `Looks like class(${
          original.name
        }) has been already decorated with "useDependencyPathInstance".`
      );
    }

    instance[DEPENDENCY_PATH_SYMBOL] = new DependencyPath(instance);

    return instance;
  };

  f.prototype = original.prototype;

  return f;
};
