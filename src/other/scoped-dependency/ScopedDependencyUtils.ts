import { SCOPED_DEPENDENCY } from "./consts";
import { IScoped, IScopedContext, IScopedParent, IScopedChild } from "./scoped-dependency";

const customNames = new WeakMap<Object, string>();
const parentReferences = new WeakMap<IScopedChild, IScopedParent>();

/** @internal */
export class ScopedDependencyUtils {
  public static isScopedDependency(instance: unknown): instance is IScoped {
    if (typeof instance !== "object" || instance === null) {
      return false;
    }

    return !!(instance as IScoped)[SCOPED_DEPENDENCY];
  }

  public static hasParent(child: unknown): boolean {
    if (!this.isScopedDependency(child)) {
      throw new Error(`Instance is not a scoped dependency!`);
    }

    return parentReferences.has(child);
  }

  public static getParent(child: unknown): IScoped | null {
    if (!this.isScopedDependency(child)) {
      throw new Error(`Instance is not a scoped dependency!`);
    }

    if (this.hasParent(child)) {
      return parentReferences.get(child)!;
    }

    return null;
  }

  public static setParent(child: unknown, parent: unknown): void {
    if (!this.isScopedDependency(child)) {
      throw new Error(`Child instance is not a scopedDependency!`);
    }

    if (!this.isScopedDependency(parent)) {
      throw new Error(`Parent instance is not a scopedDependency!`);
    }

    if (this.hasParent(child)) {
      if (this.getParent(child) === parent) {
        /*
            In case of inheritance base class can already be decorated
            with `scoped`. In that case it's unnesesery for child class
            to be decorated with `scope` but should be allowed in case
            someone needs to alter scope name or add `onInstanceCreation` hook.
        */

        return;
      }

      throw new Error(`Child instance already has set parent!`);
    }

    parentReferences.set(child, parent);
  }

  public static markAsScoped(instance: unknown): IScoped {
    if (typeof instance !== "object" || instance === null) {
      throw new Error(`Cannot mark instance as scoped dependency because it's not an object!`);
    }

    ((instance as unknown) as IScoped)[SCOPED_DEPENDENCY] = true;

    return (instance as unknown) as IScoped;
  }

  public static setCustomName(instance: IScoped, name: string): void {
    customNames.set(instance, name);
  }

  public static getCustomName(instance: IScoped): string | null {
    return customNames.has(instance) ? customNames.get(instance)! : null;
  }

  public static findScopedChildren(parent: IScoped): IScoped[] {
    return Object.entries(parent)
      .map(([_, value]) => value)
      .filter(this.isScopedDependency);
  }

  public static getScopedContexts(instance: unknown): IScopedContext[] {
    const scopes: IScopedContext[] = [];

    let current = this.isScopedDependency(instance) ? instance : null;

    while (current) {
      scopes.unshift({
        id: this.getScopedID(current),
        name: this.getScopedName(current)
      });

      current = this.getParent(current);
    }

    return scopes;
  }

  public static getScopedName(dependency: IScoped): string {
    const customName = this.getCustomName(dependency);

    if (customName) {
      return customName;
    }

    return dependency.constructor.name;
  }

  public static getScopedID(dependency: IScoped): string | number | null {
    const id = (dependency as any).id;

    if (typeof id === "undefined") {
      return null;
    }

    return id;
  }
}
