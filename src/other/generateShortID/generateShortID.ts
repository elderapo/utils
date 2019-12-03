import { v4 } from "uuid";

export const generateShortID = (length: number = 8): string => {
  return v4().slice(0, 8);
};
