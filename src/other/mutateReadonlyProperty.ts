import { Writeable } from "../types";

export const mutateReadonlyProperty = <TARGET, KEY extends keyof TARGET, VALUE extends TARGET[KEY]>(
  obj: Readonly<TARGET>,
  key: KEY,
  newValue: VALUE
) => {
  (obj as Writeable<TARGET>)[key] = newValue;
};
