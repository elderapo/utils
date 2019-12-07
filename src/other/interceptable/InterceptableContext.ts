export enum InterceptableContextType {
  Original = "original",
  Internal = "internal",
  External = "external"
}

export class InterceptableContext {
  private static contextTypes = new WeakMap<Object, InterceptableContextType>();

  private static originalToInternal = new WeakMap<Object, Object>();
  private static originalToExternal = new WeakMap<Object, Object>();
  private static externalToOriginal = new WeakMap<Object, Object>();
  private static internalToOriginal = new WeakMap<Object, Object>();

  public static setupContexts(original: Object, internal: Object, external: Object): void {
    this.contextTypes.set(original, InterceptableContextType.Original);
    this.contextTypes.set(internal, InterceptableContextType.Internal);
    this.contextTypes.set(external, InterceptableContextType.External);

    this.originalToInternal.set(original, internal);
    this.originalToExternal.set(original, external);
    this.internalToOriginal.set(internal, original);
    this.externalToOriginal.set(external, original);
  }

  public static unwrap(anything: Object): Object | null {
    const contextType = this.getContextType(anything);

    if (!contextType) {
      return null;
    }

    if (contextType === InterceptableContextType.Original) {
      return anything;
    }

    const map =
      contextType === InterceptableContextType.Internal
        ? this.internalToOriginal
        : this.externalToOriginal;

    return map.has(anything) ? map.get(anything)! : null;
  }

  public static getContextType(context: Object): InterceptableContextType | null {
    return this.contextTypes.has(context) ? this.contextTypes.get(context)! : null;
  }
}
