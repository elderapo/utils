import { interceptable, InterceptableContext } from "../interceptable";
import { ScopedInternals } from "./ScopedInternals";

/*
 *
 * @TODO: maybe add support for deleting properties? Releasing old parent (deleting/unbinding)
 * and assigning a new one. Rust 2.0? LUL
 *
 */

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
      // Not really nessesery but lets do it anyways...
      const original = InterceptableContext.unwrap(target);

      if (!original) {
        /* istanbul ignore next */
        throw new Error(
          `Scoped::afterConstruct couldn't find original instance. Is that even possible?`
        );
      }

      ScopedInternals.createScoped(original);

      if (options.name) {
        ScopedInternals.applyCustomName(original, options.name);
      }

      if (options.onInstanceCreation) {
        options.onInstanceCreation(original);
      }
    },
    set: (target, key, value, isInternal) => {
      const originalParent = InterceptableContext.unwrap(target);
      const originalChild = InterceptableContext.unwrap(value);

      if (ScopedInternals.isScoped(originalParent) && ScopedInternals.isScoped(originalChild)) {
        ScopedInternals.setParent(originalChild, originalParent);
      }

      target[key] = value;
      return true;
    }
  })(originalConstructor);

  Object.defineProperty(Class, "name", { value: originalConstructor.name });

  return Class;
};

export const listScopes = (instance: Object): IScopedContext[] => {
  const original = InterceptableContext.unwrap(instance);
  return ScopedInternals.getScopedContexts(original);
};
