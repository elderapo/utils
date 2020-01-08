// prettier-ignore
export type DeepReadonly<T> =
  T extends Map<infer U, infer V> ? ReadonlyMap<DeepReadonly<U>, DeepReadonly<V>> :
  T extends Set<infer U> ? ReadonlySet<DeepReadonly<U>> :
  T extends Promise<infer U> ? Promise<DeepReadonly<U>> :
  T extends Primitive ? T :
  T extends Function ? T :
  T extends Object ? DeepReadonlyObject<T> : never;

type DeepReadonlyObject<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> };

type Primitive = string | number | boolean | undefined | null | symbol | bigint;
