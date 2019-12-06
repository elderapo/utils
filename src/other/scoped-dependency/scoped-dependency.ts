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
      // console.log(`After constructing class(${target.constructor.name})...`);
      const external = InterceptableContext.getContext(target, InterceptableContextType.External);

      if (!external) {
        throw new Error("pizda nad glowa");
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
    set: (target, key, value, isInternal) => {
      target[key] = value;
      // console.log(
      //   `Setting class(${target.constructor.name}) key(${String(key)}) to `,
      //   value,
      //   `isInternal(${isInternal})...`
      // );
      const child = target[key];

      if (!ScopedInternals.isScoped(child)) {
        return true;
      }

      const externalParent = InterceptableContext.getContext(
        target,
        InterceptableContextType.External
      );

      if (!externalParent) {
        throw new Error("pizda nad glowa");
      }

      ScopedInternals.createScoped(externalParent);
      ScopedInternals.setParent(child, externalParent);

      return true;
    }
  })(originalConstructor);

  Object.defineProperty(Class, "name", { value: originalConstructor.name });

  return Class;
};

// export const scoped = (options: IScopedOptions = {}): any => (
//   originalConstructor: new (...args: any[]) => any
// ) => {
//   const original = originalConstructor;

//   // the new constructor behaviour
//   const f: any = function(...args: any[]) {
//     // @ts-ignore
//     const that = (this as unknown) as any;

//     that.bbb = 123;

//     const result = original.apply(that, args);

//     ScopedInternals.createScoped(that);

//     if (options.name) {
//       ScopedInternals.applyCustomName(that, options.name);
//     }

//     if (options.onInstanceCreation) {
//       options.onInstanceCreation(that);
//     }

//     return result;
//   };

//   // copy prototype so intanceof operator still works
//   f.prototype = original.prototype;

//   // return new constructor (will override original)
//   return f;
// };

// export const scoped = (options: IScopedOptions = {}): any => (
//   originalConstructor: new (...args: any[]) => any
// ) => {
//   const Class = class extends originalConstructor {
//     constructor(...args: any[]) {
//       super(...args);

//       ScopedInternals.createScoped(this);

//       if (options.name) {
//         ScopedInternals.applyCustomName(this, options.name);
//       }

//       if (options.onInstanceCreation) {
//         options.onInstanceCreation(this);
//       }
//     }
//   };

//   // Fix class name!
//   Object.defineProperty(Class, "name", { value: originalConstructor.name });

//   return Class;
// };

export const listScopes = (instance: Object): IScopedContext[] =>
  ScopedInternals.getScopedContexts(instance);
