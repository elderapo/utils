import {
  DependencyPath,
  DEPENDENCY_PATH_CUSTOM_NAME_SYMBOL,
  DEPENDENCY_PATH_SYMBOL,
  IInstanceWithDependencyPath,
  INamespaceItem
} from "./DependencyPath";

export const getNamespacesList = (instance: Object): INamespaceItem[] => {
  const dependencyPath: DependencyPath = (instance as any)[DEPENDENCY_PATH_SYMBOL];

  if (!dependencyPath) {
    throw new Error(
      `Cannot get namespace list for class(${
        instance.constructor.name
      }) because it hasn't been decorated with "useDependencyPathInstance"!`
    );
  }

  return dependencyPath["getNamespacesList"]();
};

export interface IRegisterDependencyPathOptions {
  onInstanceCreation?: (target: any, dependencyPath: DependencyPath) => void;
}

export const registerDependencyPath = (options: IRegisterDependencyPathOptions = {}) => (
  constr: any
): any => {
  const Class = class extends constr {
    constructor(...args: any[]) {
      super(...args);

      const instance = (this as unknown) as IInstanceWithDependencyPath;

      if (instance[DEPENDENCY_PATH_SYMBOL]) {
        instance[DEPENDENCY_PATH_SYMBOL]["rebuildState"]();
        return;
      }

      const dependencyPath = new DependencyPath(instance);
      instance[DEPENDENCY_PATH_SYMBOL] = dependencyPath;

      if (options.onInstanceCreation) {
        options.onInstanceCreation(instance, dependencyPath);
      }
    }
  };

  // Fix class name!
  Object.defineProperty(Class, "name", { value: constr.name });

  return Class;
};

export const setNamespaceName = (namespace: string) => (constr: any) => {
  constr[DEPENDENCY_PATH_CUSTOM_NAME_SYMBOL] = namespace;
  return constr;
};
