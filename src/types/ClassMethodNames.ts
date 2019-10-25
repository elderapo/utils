export type ClassMethodNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
