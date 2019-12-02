export interface INamespaceItem {
  id: string | number | null;
  namespace: string;
}

export const DEPENDENCY_PATH_SYMBOL = Symbol("DEPENDENCY_PATH_SYMBOL");

export interface IInstanceWithDependencyPath {
  [DEPENDENCY_PATH_SYMBOL]: DependencyPath;
}

export class DependencyPath {
  private parents: IInstanceWithDependencyPath[] = [];
  private children: IInstanceWithDependencyPath[] = [];

  public constructor(private scope: IInstanceWithDependencyPath) {
    this.children = this.findChildren(scope);
    this.nest(this.scope);
  }

  protected getNamespacesList(): INamespaceItem[] {
    return [...this.parents, this.scope].map(instance => {
      const casted = (instance as any) as { id: any };

      return {
        id: typeof casted.id !== "undefined" ? casted.id : null,
        namespace: casted.constructor.name
      };
    });
  }

  private findChildren(scope: Object) {
    return Object.entries(scope)
      .map(([key, value]) => value as IInstanceWithDependencyPath)
      .filter(inst => inst[DEPENDENCY_PATH_SYMBOL]);
  }

  private nest(parent: IInstanceWithDependencyPath) {
    this.children.forEach(child => {
      if (child[DEPENDENCY_PATH_SYMBOL]) {
        child[DEPENDENCY_PATH_SYMBOL].parents = [...this.parents, this.scope];
        child[DEPENDENCY_PATH_SYMBOL].nest(parent);
      }
    });
  }
}
