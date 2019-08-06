import { CustomError } from "ts-custom-error";
import { SerializableGroup } from "./SerializableGroup";

export class SerializeGroupTransformationError extends CustomError {
  constructor(public sg: SerializableGroup<any, any>, public thing: any) {
    super(
      `SerializeGroup<${sg.options.typename}> couldn't transform Thing<${JSON.stringify(thing)}>!`
    );
  }
}
