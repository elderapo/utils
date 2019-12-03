import {
  DependencyPath,
  DEPENDENCY_PATH_CUSTOM_NAME_SYMBOL,
  DEPENDENCY_PATH_SYMBOL,
  IInstanceWithDependencyPath,
  INamespaceItem
} from "./DependencyPath";
import { noop } from "../noop";

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

export const registerDynamicDependencyPathUpdater = (
  target: any,
  key: string,
  descriptor: PropertyDescriptor
) => {
  const originalMethod = descriptor.value;

  descriptor.value = function(...args: any[]) {
    const dependencyPath = (this as any)[DEPENDENCY_PATH_SYMBOL] as DependencyPath;

    if (!dependencyPath) {
      throw new Error(
        `Class(${target.constructor.name}) hasn't been registered as dependency path.`
      );
    }

    const rebuildState = () => {
      dependencyPath["rebuildState"]();
    };

    try {
      const returnedValue = originalMethod.apply(this, args);

      if (returnedValue instanceof Promise) {
        // this wrapping is required so if original promise is not handler there will be error/warning shown in console
        return new Promise(async (resolve, reject) => {
          try {
            const resolvedPromiseValue = await returnedValue;

            rebuildState();
            return resolve(resolvedPromiseValue);
          } catch (ex) {
            rebuildState();
            return reject(ex);
          }
        });
      }

      rebuildState();
      return returnedValue;
    } catch (ex) {
      rebuildState();
      throw ex;
    }
  };

  // return edited descriptor as opposed to overwriting the descriptor
  return descriptor;
};

export const setNamespaceName = (namespace: string) => (constr: any) => {
  constr[DEPENDENCY_PATH_CUSTOM_NAME_SYMBOL] = namespace;
  return constr;
};
