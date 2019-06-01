import { ValueOf } from "../types";

export const isValidEnum = <ENUM, ENUMITEM extends ValueOf<ENUM>>(
  Enum: ENUM,
  item: ENUMITEM
): boolean => {
  return Object.values(Enum).includes(item);
};
