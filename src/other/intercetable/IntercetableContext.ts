export enum IntercetableContextType {
  Internal = "internal",
  External = "external"
}

export class IntercetableContext {
  private static contextTypes = new WeakMap<Object, IntercetableContextType>();

  public static setContextType(context: Object, type: IntercetableContextType): void {
    this.contextTypes.set(context, type);
  }

  public static getContextType(context: Object): IntercetableContextType | null {
    return this.contextTypes.has(context) ? this.contextTypes.get(context)! : null;
  }
}
