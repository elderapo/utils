import { interceptable, InterceptableContext, InterceptableContextType } from "../interceptable";
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
  const Class = interceptable({
    afterConstruct: target => {
      const external = InterceptableContext.getContext(target, InterceptableContextType.External);

      if (!external) {
        throw new Error(
          `Scoped::afterConstruct couldn't find external instance. Is that even possible?`
        );
      }

      ScopedInternals.createScoped(external);

      ScopedInternals.applyCustomName(
        external,
        options.name ? options.name : target.constructor.name
      );

      if (options.onInstanceCreation) {
        options.onInstanceCreation(external);
      }
    },
    set: (target, key, child, isInternal) => {
      if (!ScopedInternals.isScoped(child)) {
        return true;
      }

      const externalParent = InterceptableContext.getContext(
        target,
        InterceptableContextType.External
      );

      if (!externalParent) {
        throw new Error(
          `Scoped::set couldn't find external parent instance. Is that even possible?`
        );
      }

      ScopedInternals.createScoped(externalParent);
      ScopedInternals.setParent(child, externalParent);

      return true;
    }
  })(originalConstructor);

  Object.defineProperty(Class, "name", { value: originalConstructor.name });

  return Class;
};

export const listScopes = (instance: Object): IScopedContext[] =>
  ScopedInternals.getScopedContexts(instance);
