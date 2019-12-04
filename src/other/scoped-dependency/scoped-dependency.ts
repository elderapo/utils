import { ScopedInternals } from "./ScopedInternals";

export interface IScopedContext {
  name: string;
  id: number | string | null;
}

export interface IScopedOptions {
  name?: string;
  onInstanceCreation?: <T>(instance: T) => void;
}

export const scoped = (options: IScopedOptions = {}): any => (
  originalConstructor: new (...args: any[]) => any
) => {
  const Class = class extends originalConstructor {
    constructor(...args: any[]) {
      super(...args);

      ScopedInternals.createScoped(this);

      if (options.name) {
        ScopedInternals.applyCustomName(this, options.name);
      }

      if (options.onInstanceCreation) {
        options.onInstanceCreation(this);
      }
    }
  };

  // Fix class name!
  Object.defineProperty(Class, "name", { value: originalConstructor.name });

  return Class;
};

export const attachDependency = (parent: Object, child: Object): void => {
  ScopedInternals.setParent(child, parent);
};

export const listScopes = (instance: Object): IScopedContext[] =>
  ScopedInternals.getScopedContexts(instance);
