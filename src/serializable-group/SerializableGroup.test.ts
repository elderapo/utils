import { SerializableGroup } from "./SerializableGroup";
import { CustomError } from "ts-custom-error";
import { SerializeGroupTransformationError } from "./serializable-group-errors";

describe("SerializableGroup", () => {
  it("should work correctly with Object as BaseClass (not provided)", () => {
    enum IDS {
      ClassA = "CLASS_A"
    }

    type Payloads = {
      [IDS.ClassA]: { a: string };
    };

    const sg = new SerializableGroup<Payloads, "Sample">({
      typename: "Sample"
    });

    const ClassA = sg.createClassConstructor(IDS.ClassA);

    expect(ClassA).toBeTruthy();

    const classAInstance1 = new ClassA({ a: "aaa" });

    expect(classAInstance1).toBeInstanceOf(Object);
    expect(classAInstance1).toBeInstanceOf(ClassA);
    expect(classAInstance1).toMatchSnapshot();

    const classAInstance1Serialized = sg.serialize(classAInstance1);

    expect(classAInstance1Serialized).toMatchSnapshot();

    const classAInstance1Deserialized = sg.deserialize(classAInstance1Serialized);

    expect(classAInstance1Deserialized).toBeInstanceOf(Object);
    expect(classAInstance1Deserialized).toBeInstanceOf(ClassA);
    expect(classAInstance1Deserialized).toMatchSnapshot();
  });

  it("should work correctly with SomeBaseClass as BaseClass", () => {
    enum IDS {
      ClassA = "CLASS_A"
    }

    type Payloads = {
      [IDS.ClassA]: { a: string };
    };

    class SomeBaseClass {
      public getSomething() {
        return "something";
      }
    }

    const sg = new SerializableGroup<Payloads, "Sample", SomeBaseClass>({
      typename: "Sample",
      BaseClass: SomeBaseClass
    });

    const ClassA = sg.createClassConstructor(IDS.ClassA);

    expect(ClassA).toBeTruthy();

    const classAInstance1 = new ClassA({ a: "aaa" });

    expect(classAInstance1).toBeInstanceOf(SomeBaseClass);
    expect(classAInstance1).toBeInstanceOf(ClassA);
    expect(classAInstance1).toMatchSnapshot();

    const classAInstance1Serialized = sg.serialize(classAInstance1);

    expect(classAInstance1Serialized).toMatchSnapshot();

    const classAInstance1Deserialized = sg.deserialize(classAInstance1Serialized);

    expect(classAInstance1Deserialized).toBeInstanceOf(SomeBaseClass);
    expect(classAInstance1Deserialized).toBeInstanceOf(ClassA);
    expect(classAInstance1Deserialized).toMatchSnapshot();

    expect(typeof classAInstance1Deserialized.getSomething).toBe("function");
    expect(classAInstance1Deserialized.getSomething()).toBe("something");
  });

  it("should work correctly with CustomError as BaseClass", () => {
    enum IDS {
      ClassA = "CLASS_A"
    }

    type Payloads = {
      [IDS.ClassA]: { a: string };
    };

    const sg = new SerializableGroup<Payloads, "MyError", CustomError>({
      typename: "MyError",
      BaseClass: CustomError
    });

    const ClassA = sg.createClassConstructor(IDS.ClassA);

    expect(ClassA).toBeTruthy();

    const classAInstance1 = new ClassA({ a: "aaa" });

    expect(classAInstance1).toBeInstanceOf(Error);
    expect(classAInstance1).toBeInstanceOf(CustomError);
    expect(classAInstance1).toBeInstanceOf(ClassA);
    expect(classAInstance1).toMatchSnapshot();

    const classAInstance1Serialized = sg.serialize(classAInstance1);

    expect(classAInstance1Serialized).toMatchSnapshot();

    const classAInstance1Deserialized = sg.deserialize(classAInstance1Serialized);

    expect(classAInstance1Deserialized).toBeInstanceOf(Error);
    expect(classAInstance1Deserialized).toBeInstanceOf(CustomError);
    expect(classAInstance1Deserialized).toBeInstanceOf(ClassA);
    expect(classAInstance1Deserialized).toMatchSnapshot();

    expect(typeof classAInstance1Deserialized.message).toBe("string");
  });

  it("should correctly throw error if serialize is called with wrong ___typename___", () => {
    enum IDS {
      ClassA = "CLASS_A"
    }

    type Payloads = {
      [IDS.ClassA]: { a: string };
    };

    const sg = new SerializableGroup<Payloads, "Sample">({
      typename: "Sample"
    });

    expect(() => sg.serialize({ ___typename___: "aaa" })).toThrowError(
      SerializeGroupTransformationError
    );
    expect(() => sg.serialize({ ___typename___: "Sample" })).not.toThrowError(
      SerializeGroupTransformationError
    );
  });

  it("should correctly throw error if deserialize is called with wrong ___typename___", () => {
    enum IDS {
      ClassA = "CLASS_A"
    }

    type Payloads = {
      [IDS.ClassA]: { a: string };
    };

    const sg = new SerializableGroup<Payloads, "Sample">({
      typename: "Sample"
    });

    const ClassA = sg.createClassConstructor(IDS.ClassA);

    expect(() =>
      sg.deserialize({ id: IDS.ClassA, payload: { a: "aaa" }, ___typename___: "__wrong__" })
    ).toThrowError(SerializeGroupTransformationError);
    expect(() =>
      sg.deserialize({ id: IDS.ClassA, payload: { a: "aaa" }, ___typename___: "Sample" })
    ).not.toThrowError(SerializeGroupTransformationError);
  });

  it("should correctly throw error if recreate is called with wrong id", () => {
    enum IDS {
      ClassA = "CLASS_A"
    }

    type Payloads = {
      [IDS.ClassA]: { a: string };
    };

    const sg = new SerializableGroup<Payloads, "Sample">({
      typename: "Sample"
    });

    const ClassA = sg.createClassConstructor(IDS.ClassA);

    expect(() => sg.recreate("wrongid" as any, { a: "aaa" })).toThrowError(
      SerializeGroupTransformationError
    );
    expect(() => sg.recreate(IDS.ClassA, { a: "aaa" })).not.toThrowError(
      SerializeGroupTransformationError
    );
  });
});
