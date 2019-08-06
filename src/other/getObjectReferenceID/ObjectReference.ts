export interface IObjectReference {
  globalRefID: number;
  instanceRefID: number;
  name: string;
}

export class ObjectReference implements IObjectReference {
  public readonly globalRefID: number;
  public readonly instanceRefID: number;
  public readonly name: string;

  private constructor(options: IObjectReference) {
    this.globalRefID = options.globalRefID;
    this.instanceRefID = options.instanceRefID;
    this.name = options.name;
  }

  public static __create(options: IObjectReference): ObjectReference {
    return new ObjectReference(options);
  }
}

ObjectReference.prototype.toString = function() {
  return `ObjectReference(Global(#${this.globalRefID}), ${this.name}(#${this.instanceRefID}))`;
};
