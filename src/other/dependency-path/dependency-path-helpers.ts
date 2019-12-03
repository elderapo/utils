import { ClassType } from "../../types";
import {
  DependencyPath,
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
  afterInstanceCreation?: (target: any, dependencyPath: DependencyPath) => void;
}

export const registerDependencyPath = (options: IRegisterDependencyPathOptions = {}) => <
  T extends ClassType
>(
  constr: T
) => {
  const Class = class extends constr {
    constructor(...args: any[]) {
      super(...args);

      const instance = (this as unknown) as IInstanceWithDependencyPath;

      const dependencyPath = new DependencyPath(instance);
      instance[DEPENDENCY_PATH_SYMBOL] = dependencyPath;

      if (options.afterInstanceCreation) {
        options.afterInstanceCreation(instance, dependencyPath);
      }
    }
  };

  // Fix class name!
  Object.defineProperty(Class, "name", { value: constr.name });

  return Class;
};
