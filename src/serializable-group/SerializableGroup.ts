import { Constructable } from "../types";
import { SerializeGroupTransformationError } from "./serializable-group-errors";

export interface ISerializableGroupOptions<TYPENAME, BASE_CLASS_SHAPE> {
  typename: string;
  BaseClass?: BASE_CLASS_SHAPE;
}

export class DefaultBaseClass {} // @TEMP: https://github.com/microsoft/TypeScript/issues/33023

export class SerializableGroup<PAYLOADS, TYPENAME extends string, BASE_CLASS_SHAPE = Object> {
  private cache = new Map();

  constructor(
    public options: ISerializableGroupOptions<TYPENAME, Constructable<BASE_CLASS_SHAPE>>
  ) {}

  public createClassConstructor<ID extends keyof PAYLOADS, PAYLOAD = PAYLOADS[ID]>(id: ID) {
    const typename = this.options.typename;
    const BaseClass = (this.options.BaseClass || DefaultBaseClass) as Constructable<Object>;

    const Class = class extends BaseClass {
      public readonly id: ID;
      public readonly payload: PAYLOAD;
      public readonly ["___typename___"] = typename;

      constructor(payload: PAYLOAD) {
        super();

        this.id = id;
        this.payload = payload;
      }
    };

    Object.defineProperty(Class, "name", { value: `${typename}<${id}>` });

    this.cache.set(id, Class);

    return Class as Constructable<BASE_CLASS_SHAPE & InstanceType<typeof Class>, [PAYLOAD]>;
  }

  public checkTypename(instance: any): boolean {
    return instance && instance.___typename___ === this.options.typename;
  }

  public serialize(thing: any): any {
    if (!this.checkTypename(thing)) {
      throw new SerializeGroupTransformationError(this, thing);
    }

    const serialized = JSON.parse(JSON.stringify(thing));

    if (thing instanceof Error) {
      serialized.message = thing.message;
    }

    return serialized;
  }

  public deserialize<ID extends keyof PAYLOADS, PAYLOAD = PAYLOADS[ID]>(thing: {
    id: ID;
    payload: PAYLOAD;
    ___typename___: string;
  }) {
    if (!this.checkTypename(thing)) {
      throw new SerializeGroupTransformationError(this, thing);
    }

    return this.recreate(thing.id, thing.payload);
  }

  public recreate<ID extends keyof PAYLOADS, PAYLOAD = PAYLOADS[ID]>(id: ID, payload: PAYLOAD) {
    if (!this.cache.has(id)) {
      throw new SerializeGroupTransformationError(this, { id, payload });
    }

    const Class = this.cache.get(id);

    return new Class(payload) as {
      id: ID;
      payload: PAYLOAD;
      ___typename___: TYPENAME;
    } & BASE_CLASS_SHAPE;
  }
}
