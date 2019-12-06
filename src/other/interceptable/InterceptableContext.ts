export enum InterceptableContextType {
  Original = "original",
  Internal = "internal",
  External = "external"
}

export class InterceptableContext {
  private static contextTypes = new WeakMap<Object, InterceptableContextType>();
  private static originalToInternal = new WeakMap<Object, Object>();
  private static originalToExternal = new WeakMap<Object, Object>();

  public static setupContexts(original: Object, internal: Object, external: Object): void {
    this.contextTypes.set(original, InterceptableContextType.Original);
    this.contextTypes.set(internal, InterceptableContextType.Internal);
    this.contextTypes.set(external, InterceptableContextType.External);

    this.originalToInternal.set(original, internal);
    this.originalToExternal.set(original, external);
  }

  public static getContext(
    original: Object,
    type: InterceptableContextType.Internal | InterceptableContextType.External
  ): Object | null {
    const map =
      type === InterceptableContextType.External
        ? this.originalToExternal
        : this.originalToInternal;

    return map.has(original) ? map.get(original)! : null;
  }

  public static getContextType(context: Object): InterceptableContextType | null {
    return this.contextTypes.has(context) ? this.contextTypes.get(context)! : null;
  }
}
