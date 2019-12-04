import {
  SCOPED_DEPENDENCY,
  SCOPED_DEPENDENCY_CUSTOM_NAME,
  SCOPED_DEPENDENCY_PARENT
} from "./consts";
import { IScopedDependency, IScopeContext } from "./scoped-dependency";

/** @internal */
export class ScopedDependencyUtils {
  public static isScopedDependency(instance: unknown): instance is IScopedDependency {
    if (typeof instance !== "object" || instance === null) {
      return false;
    }

    return !!(instance as IScopedDependency)[SCOPED_DEPENDENCY];
  }

  public static hasParent(instance: unknown): boolean {
    if (!this.isScopedDependency(instance)) {
      throw new Error(`Instance is not a scoped dependency!`);
    }

    return !!instance[SCOPED_DEPENDENCY_PARENT];
  }

  public static getParent(instance: unknown): IScopedDependency | null {
    if (!this.isScopedDependency(instance)) {
      throw new Error(`Instance is not a scoped dependency!`);
    }

    if (this.hasParent(instance)) {
      return instance[SCOPED_DEPENDENCY_PARENT] || null;
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

    if (child[SCOPED_DEPENDENCY_PARENT] === parent) {
      /*
          In case of inheritance base class can already be decorated
          with `scoped`. In that case it's unnesesery for child class
          to be decorated with `scope` but should be allowed in case
          someone needs to alter scope name or add `onInstanceCreation` hook.
      */

      return;
    }

    if (this.hasParent(child)) {
      throw new Error(`Child instance already has set parent!`);
    }

    child[SCOPED_DEPENDENCY_PARENT] = parent;
  }

  public static markAsScoped(instance: unknown): IScopedDependency {
    if (typeof instance !== "object" || instance === null) {
      throw new Error(`Cannot mark instance as scoped dependency because it's not an object!`);
    }

    ((instance as unknown) as IScopedDependency)[SCOPED_DEPENDENCY] = true;

    return (instance as unknown) as IScopedDependency;
  }

  public static setCustomName(instance: IScopedDependency, name: string): void {
    instance[SCOPED_DEPENDENCY_CUSTOM_NAME] = name;
  }

  public static getCustomName(instance: IScopedDependency): string | null {
    return instance[SCOPED_DEPENDENCY_CUSTOM_NAME] || null;
  }

  public static findChildren(dependency: IScopedDependency): IScopedDependency[] {
    return Object.entries(dependency)
      .map(([key, value]) => value)
      .filter(this.isScopedDependency);
  }

  public static getScopesList(instance: unknown): IScopeContext[] {
    const scopes: IScopeContext[] = [];

    let current = this.isScopedDependency(instance) ? instance : null;

    while (current) {
      scopes.unshift({
        id: this.getScopedDependencyID(current),
        name: this.getScopedDependencyName(current)
      });

      current = this.getParent(current);
    }

    return scopes;
  }

  public static getScopedDependencyName(dependency: IScopedDependency): string {
    const customName = this.getCustomName(dependency);

    if (customName) {
      return customName;
    }

    return dependency.constructor.name;
  }

  public static getScopedDependencyID(dependency: IScopedDependency): string | number | null {
    const id = (dependency as any).id;

    if (typeof id === "undefined") {
      return null;
    }

    return id;
  }
}
