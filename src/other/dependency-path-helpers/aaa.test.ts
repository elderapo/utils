import { useDependencyPathInstance, getNamespacesList } from "./magic";

describe("aaa", () => {
  it("works plz", () => {
    @useDependencyPathInstance
    class B {}

    @useDependencyPathInstance
    class A {
      public b = new B();
    }

    const a = new A();
    const b = new B();

    expect(getNamespacesList(a)).toMatchObject([{ id: null, namespace: "A" }]);
    expect(getNamespacesList(a.b)).toMatchObject([
      { id: null, namespace: "A" },
      { id: null, namespace: "B" }
    ]);
    expect(getNamespacesList(b)).toMatchObject([{ id: null, namespace: "B" }]);
  });
});
