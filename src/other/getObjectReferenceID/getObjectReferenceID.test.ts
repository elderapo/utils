import { resetObjectReferenceIDCache, getObjectReferenceID } from "./getObjectReferenceID";

describe("getObjectReferenceID", () => {
  afterEach(() => {
    resetObjectReferenceIDCache();
  });

  it("should return object", () => {
    expect(getObjectReferenceID({})).toBeInstanceOf(Object);
  });

  it("should return different references for different objects", () => {
    expect(getObjectReferenceID({})).not.toBe(getObjectReferenceID({}));
  });

  it("should return same reference for same object", () => {
    const obj = {};

    expect(getObjectReferenceID(obj)).toBe(getObjectReferenceID(obj));
  });

  it("should correctly serialzie with .toString()", () => {
    class SomeClass {}

    const someClassInstance1 = new SomeClass();
    const someClassInstance2 = new SomeClass();

    expect(getObjectReferenceID(someClassInstance1).toString()).toBe(
      `ObjectReference(Global(#0), SomeClass(#0))`
    );
    expect(getObjectReferenceID(someClassInstance2).toString()).toBe(
      `ObjectReference(Global(#1), SomeClass(#1))`
    );
    expect(getObjectReferenceID(someClassInstance1).toString()).toBe(
      `ObjectReference(Global(#0), SomeClass(#0))`
    );
  });

  it("should use 'RawObject' type name for objects without prototype", () => {
    const obj = Object.create(null);

    expect(getObjectReferenceID(obj).toString()).toBe(`ObjectReference(Global(#0), RawObject(#0))`);
  });
});
