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
  return new Proxy(originalConstructor, {
    construct(target, args) {
      // console.log(target);
      const that = Reflect.construct(Object, args);
      that.aaa = "bbbb";

      ScopedInternals.createScoped(that);

      if (options.name) {
        ScopedInternals.applyCustomName(that, options.name);
      }

      if (options.onInstanceCreation) {
        options.onInstanceCreation(that);
      }

      return that;
    }
  });
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

export const attachDependency = (parent: Object, child: Object): void => {
  ScopedInternals.setParent(child, parent);
};

export const listScopes = (instance: Object): IScopedContext[] =>
  ScopedInternals.getScopedContexts(instance);
