import { SCOPED_DEPENDENCY } from "./consts";
import { ScopedDependencyUtils } from "./ScopedDependencyUtils";

export interface IScopedParent extends IScoped {}
export interface IScopedChild extends IScoped {}

export interface IScoped {
  [SCOPED_DEPENDENCY]: true;
}

export interface IScopedContext {
  name: string;
  id: number | string | null;
}

export interface IScopedOptions {
  name?: string;
  onInstanceCreation?: <T>(instance: T & IScoped) => void;
}

export const scoped = (options: IScopedOptions = {}): any => (
  originalConstructor: new (...args: any[]) => any
) => {
  const Class = class extends originalConstructor {
    constructor(...args: any[]) {
      super(...args);

      const scopedInstance = ScopedDependencyUtils.markAsScoped(this);

      ScopedDependencyUtils.findScopedChildren(scopedInstance).forEach(child =>
        ScopedDependencyUtils.setParent(child, scopedInstance)
      );

      if (options.name) {
        ScopedDependencyUtils.setCustomName(scopedInstance, options.name);
      }

      if (options.onInstanceCreation) {
        options.onInstanceCreation(scopedInstance);
      }
    }
  };

  // Fix class name!
  Object.defineProperty(Class, "name", { value: originalConstructor.name });

  return Class;
};

export const attachDependency = (parent: Object, child: Object): void => {
  ScopedDependencyUtils.setParent(child, parent);
};

export const listScopes = (instance: Object): IScopedContext[] =>
  ScopedDependencyUtils.getScopedContexts(instance);
