/** @internal */

import { IScopedContext } from "./scoped-dependency";

// Helper types that has been created so it's easier to grasp wtf is going on...
interface IScoped extends Object {
  id?: string | number | null;
}
interface IScopedParent extends IScoped {}
interface IScopedChild extends IScoped {}

// Metadata stores
const customNames = new WeakMap<IScoped, string>();
const parentReferences = new WeakMap<IScopedChild, IScopedParent>();
const scopedInstances = new WeakSet<IScoped>();

export class ScopedInternals {
  public static createScoped(instance: Object): void {
    if (scopedInstances.has(instance)) {
      return;
    }

    scopedInstances.add(instance);

    // mark direct children as parents
    // this.findDirectScopedChildren(instance).forEach(child => this.setParent(child, instance));
  }

  public static applyCustomName(instance: IScoped, name: string): void {
    customNames.set(instance, name);
  }

  public static getScopedContexts(instance: unknown): IScopedContext[] {
    const scopes: IScopedContext[] = [];

    let current = this.isScoped(instance) ? instance : null;

    while (current) {
      scopes.unshift({
        id: typeof current.id !== "undefined" ? current.id : null,
        name: customNames.has(current) ? customNames.get(current)! : current.constructor.name
      });

      current = this.getParent(current);
    }

    return scopes;
  }

  public static setParent(child: unknown, parent: unknown): void {
    if (!this.isScoped(child)) {
      throw new Error(`Child instance is not a scopedDependency!`);
    }

    if (!this.isScoped(parent)) {
      throw new Error(`Parent instance is not a scopedDependency!`);
    }

    if (this.hasParent(child)) {
      if (this.getParent(child) === parent) {
        /**
         *
         * In case of inheritance base class can already be decorated
         * with `scoped`. In that case it's unnesesery for child class
         * to be decorated with `scope` but should be allowed in case
         * someone needs to alter scope name or add `onInstanceCreation` hook.
         *
         */

        return;
      }

      throw new Error(`Child instance already has set parent!`);
    }

    parentReferences.set(child, parent);
  }

  private static hasParent(child: unknown): boolean {
    if (!this.isScoped(child)) {
      throw new Error(`Instance is not a scoped dependency!`);
    }

    return parentReferences.has(child);
  }

  private static getParent(child: unknown): IScoped | null {
    if (!this.isScoped(child)) {
      throw new Error(`Instance is not a scoped dependency!`);
    }

    if (this.hasParent(child)) {
      return parentReferences.get(child)!;
    }

    return null;
  }

  // private static findDirectScopedChildren(parent: IScopedParent): IScopedChild[] {
  //   return Object.entries(parent)
  //     .map(([_, value]) => value)
  //     .filter(value => this.isScoped(value));
  // }

  private static hasPotencialToBeScoped(input: unknown): input is Object {
    if (typeof input !== "object" || input === null) {
      return false;
    }

    return true;
  }

  public static isScoped(instance: unknown): instance is IScoped {
    if (!this.hasPotencialToBeScoped(instance)) {
      return false;
    }

    return scopedInstances.has(instance);
  }
}
