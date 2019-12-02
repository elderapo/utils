export interface INamespaceItem {
  id: string | number | null;
  namespace: string;
}

export const DEPENDENCY_PATH_SYMBOL = Symbol("DEPENDENCY_PATH_SYMBOL");

export class DependencyPath {
  private parents: Object[] = [];
  private children: Object[] = [];

  public constructor(private scope: Object) {
    this.children = this.findChildren(scope);
    this.nest(this.scope);
  }

  protected getNamespacesList(): INamespaceItem[] {
    return [...this.parents, this.scope].map(instance => {
      const casted = instance as { id: any };

      return {
        id: typeof casted.id !== "undefined" ? casted.id : null,
        namespace: casted.constructor.name
      };
    });
  }

  private findChildren(scope: Object) {
    return Object.entries(scope)
      .map(([key, value]) => value as Object)
      .filter((inst: any) => inst[DEPENDENCY_PATH_SYMBOL]);
  }

  private nest(parent: Object) {
    this.children.forEach((child: any) => {
      if (child[DEPENDENCY_PATH_SYMBOL]) {
        child[DEPENDENCY_PATH_SYMBOL].parents = [...this.parents, this.scope];
        child[DEPENDENCY_PATH_SYMBOL].nest(parent);
      }
    });
  }
}
