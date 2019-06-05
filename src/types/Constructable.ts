export interface Constructable<INSTANCE, ARGUMENTS extends Array<unknown> = any> {
  new (...args: ARGUMENTS): INSTANCE;
}
