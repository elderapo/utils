import { IScopeContext, IScopedDependency, ScopedDependencyUtils } from "./ScopedDependencyUtils";

export interface IScopedOptions {
  name?: string;
  onInstanceCreation?: <T>(instance: T & IScopedDependency) => void;
}

export const scoped = (options: IScopedOptions = {}): any => (
  originalConstructor: new (...args: any[]) => any
) => {
  const Class = class extends originalConstructor {
    constructor(...args: any[]) {
      super(...args);

      const scopedInstance = ScopedDependencyUtils.markAsScoped(this);

      ScopedDependencyUtils.findChildren(scopedInstance).forEach(child =>
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

export const listScopes = (instance: Object): IScopeContext[] =>
  ScopedDependencyUtils.getScopesList(instance);
