/** @internal */

export enum InterceptableContextType {
  Internal = "internal",
  External = "external"
}

export class InterceptableContext {
  private static contextTypes = new WeakMap<Object, InterceptableContextType>();

  public static setContextType(context: Object, type: InterceptableContextType): void {
    this.contextTypes.set(context, type);
  }

  public static getContextType(context: Object): InterceptableContextType | null {
    return this.contextTypes.has(context) ? this.contextTypes.get(context)! : null;
  }
}
