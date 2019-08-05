import { get } from "lodash";
import { ObjectReference } from "./ObjectReference";

let cache = new WeakMap<Object, ObjectReference>();
let typeObjectIdCache = new Map<string, number>();
let globalObjectId: number = 0;

export const getObjectReferenceID = (obj: Object): ObjectReference => {
  if (cache.has(obj)) {
    return cache.get(obj)!;
  }

  const prototypeName = getObjectPrototypeName(obj);
  const globalObjectId = getNextGlobalObjectId();
  const typeObjectId = getNextTypeObjectId(prototypeName);

  const reference = ObjectReference.__create({
    globalRefID: globalObjectId,
    instanceRefID: typeObjectId,
    name: prototypeName
  });

  cache.set(obj, reference);

  return getObjectReferenceID(obj);
};

/* istanbul ignore next */
export const __resetObjectReferenceIDCache = () => {
  cache = new WeakMap();
  typeObjectIdCache = new Map();
  globalObjectId = 0;
};

const getObjectPrototypeName = (obj: Object): string => {
  return get(obj, "constructor.name") || "RawObject";
};

const getNextGlobalObjectId = (): number => {
  return globalObjectId++;
};

const getNextTypeObjectId = (prototypeName: string): number => {
  const before = typeObjectIdCache.get(prototypeName) || 0;

  typeObjectIdCache.set(prototypeName, before + 1);

  return before;
};
