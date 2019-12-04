import { scoped, listScopes, attachDependency } from "./scoped-dependency";

describe("scoped-dependency", () => {
  const nextIds = new Map<string, number>();

  const getNextId = (tag: string): number => {
    if (!nextIds.has(tag)) {
      nextIds.set(tag, 0);
    }

    const current = nextIds.get(tag)!;
    nextIds.set(tag, current + 1);

    return current;
  };

  beforeEach(() => {
    nextIds.clear();
  });

  describe("scoped", () => {
    it("should work with a single class", () => {
      @scoped()
      class A {}

      expect(listScopes(new A())).toMatchObject([{ id: null, name: "A" }]);
    });

    it("should work with multiple classes", () => {
      @scoped()
      class C {}

      @scoped()
      class B {
        public readonly c = new C();
      }

      @scoped()
      class A {
        public readonly b = new B();
      }

      const a = new A();

      expect(listScopes(a)).toMatchObject([{ id: null, name: "A" }]);
      expect(listScopes(a.b)).toMatchObject([{ id: null, name: "A" }, { id: null, name: "B" }]);
      expect(listScopes(a.b.c)).toMatchObject([
        { id: null, name: "A" },
        { id: null, name: "B" },
        { id: null, name: "C" }
      ]);
    });

    it("should work with (non decorated) inherited classes", () => {
      @scoped()
      class C {}

      @scoped()
      class B {
        public readonly c = new C();
      }

      @scoped()
      abstract class ABase {
        public readonly b = new B();
      }

      class AChild1 extends ABase {}
      class AChild2 extends ABase {}

      const a1 = new AChild1();

      expect(listScopes(a1)).toMatchObject([{ id: null, name: "AChild1" }]);
      expect(listScopes(a1.b)).toMatchObject([
        { id: null, name: "AChild1" },
        { id: null, name: "B" }
      ]);
      expect(listScopes(a1.b.c)).toMatchObject([
        { id: null, name: "AChild1" },
        { id: null, name: "B" },
        { id: null, name: "C" }
      ]);

      const a2 = new AChild2();
      expect(listScopes(a2)).toMatchObject([{ id: null, name: "AChild2" }]);
      expect(listScopes(a2.b)).toMatchObject([
        { id: null, name: "AChild2" },
        { id: null, name: "B" }
      ]);
      expect(listScopes(a2.b.c)).toMatchObject([
        { id: null, name: "AChild2" },
        { id: null, name: "B" },
        { id: null, name: "C" }
      ]);
    });

    it("should work with (decorated) inherited classes", () => {
      @scoped()
      class C {}

      @scoped()
      class B {
        public readonly c = new C();
      }

      @scoped()
      abstract class ABase {
        public readonly b = new B();
      }

      @scoped()
      class AChild1 extends ABase {}

      @scoped()
      class AChild2 extends ABase {}

      const a1 = new AChild1();

      expect(listScopes(a1)).toMatchObject([{ id: null, name: "AChild1" }]);
      expect(listScopes(a1.b)).toMatchObject([
        { id: null, name: "AChild1" },
        { id: null, name: "B" }
      ]);
      expect(listScopes(a1.b.c)).toMatchObject([
        { id: null, name: "AChild1" },
        { id: null, name: "B" },
        { id: null, name: "C" }
      ]);

      const a2 = new AChild2();
      expect(listScopes(a2)).toMatchObject([{ id: null, name: "AChild2" }]);
      expect(listScopes(a2.b)).toMatchObject([
        { id: null, name: "AChild2" },
        { id: null, name: "B" }
      ]);
      expect(listScopes(a2.b.c)).toMatchObject([
        { id: null, name: "AChild2" },
        { id: null, name: "B" },
        { id: null, name: "C" }
      ]);
    });

    it("should work with (decorated/non decorated) multiple inherited classes", () => {
      @scoped()
      class D {
        protected id = getNextId("D");
      }

      @scoped()
      class C {
        protected id = getNextId("C");
        public d = new D();
      }

      @scoped()
      abstract class BBase {
        protected id = getNextId("B");
        public c = new C();
      }

      class BChild1 extends BBase {}
      class BChild1Child1 extends BChild1 {}
      class BChild1Child1Child1 extends BChild1Child1 {}

      @scoped({ name: "B_CHILD2" })
      class BChild2 extends BBase {}
      @scoped({ name: "B_CHILD2_CHILD2" })
      class BChild2Child2 extends BChild2 {}

      @scoped()
      class A {
        public bc1 = new BChild1();
        public bc1c1 = new BChild1Child1();
        public bc1c1c1 = new BChild1Child1Child1();

        public bc2 = new BChild2();
        public bc2c2 = new BChild2Child2();
      }

      const a = new A();

      expect(listScopes(a)).toMatchObject([{ id: null, name: "A" }]);

      expect(listScopes(a.bc1)).toMatchObject([
        { id: null, name: "A" },
        { id: 0, name: "BChild1" }
      ]);
      expect(listScopes(a.bc1.c)).toMatchObject([
        { id: null, name: "A" },
        { id: 0, name: "BChild1" },
        { id: 0, name: "C" }
      ]);
      expect(listScopes(a.bc1.c.d)).toMatchObject([
        { id: null, name: "A" },
        { id: 0, name: "BChild1" },
        { id: 0, name: "C" },
        { id: 0, name: "D" }
      ]);

      expect(listScopes(a.bc1c1)).toMatchObject([
        { id: null, name: "A" },
        { id: 1, name: "BChild1Child1" }
      ]);
      expect(listScopes(a.bc1c1.c)).toMatchObject([
        { id: null, name: "A" },
        { id: 1, name: "BChild1Child1" },
        { id: 1, name: "C" }
      ]);
      expect(listScopes(a.bc1c1.c.d)).toMatchObject([
        { id: null, name: "A" },
        { id: 1, name: "BChild1Child1" },
        { id: 1, name: "C" },
        { id: 1, name: "D" }
      ]);

      expect(listScopes(a.bc1c1c1)).toMatchObject([
        { id: null, name: "A" },
        { id: 2, name: "BChild1Child1Child1" }
      ]);
      expect(listScopes(a.bc1c1c1.c)).toMatchObject([
        { id: null, name: "A" },
        { id: 2, name: "BChild1Child1Child1" },
        { id: 2, name: "C" }
      ]);
      expect(listScopes(a.bc1c1c1.c.d)).toMatchObject([
        { id: null, name: "A" },
        { id: 2, name: "BChild1Child1Child1" },
        { id: 2, name: "C" },
        { id: 2, name: "D" }
      ]);

      expect(listScopes(a.bc2)).toMatchObject([
        { id: null, name: "A" },
        { id: 3, name: "B_CHILD2" }
      ]);
      expect(listScopes(a.bc2.c)).toMatchObject([
        { id: null, name: "A" },
        { id: 3, name: "B_CHILD2" },
        { id: 3, name: "C" }
      ]);
      expect(listScopes(a.bc2.c.d)).toMatchObject([
        { id: null, name: "A" },
        { id: 3, name: "B_CHILD2" },
        { id: 3, name: "C" },
        { id: 3, name: "D" }
      ]);

      expect(listScopes(a.bc2c2)).toMatchObject([
        { id: null, name: "A" },
        { id: 4, name: "B_CHILD2_CHILD2" }
      ]);
      expect(listScopes(a.bc2c2.c)).toMatchObject([
        { id: null, name: "A" },
        { id: 4, name: "B_CHILD2_CHILD2" },
        { id: 4, name: "C" }
      ]);
      expect(listScopes(a.bc2c2.c.d)).toMatchObject([
        { id: null, name: "A" },
        { id: 4, name: "B_CHILD2_CHILD2" },
        { id: 4, name: "C" },
        { id: 4, name: "D" }
      ]);
    });

    it("should correctly alter name", () => {
      @scoped({ name: "AAA" })
      class A {}

      expect(listScopes(new A())).toMatchObject([{ id: null, name: "AAA" }]);
    });

    it("should correctly alter name multiple times", () => {
      @scoped({ name: "AAA_3" })
      @scoped({ name: "AAA_2" })
      @scoped({ name: "AAA_1" })
      class A {}

      expect(listScopes(new A())).toMatchObject([{ id: null, name: "AAA_3" }]);
    });

    it("should correctly alter name in case of inheritance", () => {
      @scoped({ name: "A_BASE" })
      abstract class ABase {}

      @scoped({ name: "A_CHILD_1" })
      class AChild1 extends ABase {}

      class AChild2 extends ABase {}

      expect(listScopes(new AChild1())).toMatchObject([{ id: null, name: "A_CHILD_1" }]);
      expect(listScopes(new AChild2())).toMatchObject([{ id: null, name: "A_BASE" }]);
    });

    it("should correctly call `onInstanceCreation`", () => {
      const onInstanceCreation = jest.fn<void, [A]>();

      @scoped({
        onInstanceCreation
      })
      class A {}

      const a1 = new A();
      expect(onInstanceCreation).toHaveBeenNthCalledWith(1, a1);

      const a2 = new A();
      expect(onInstanceCreation).toHaveBeenNthCalledWith(2, a2);

      expect(onInstanceCreation).toHaveBeenCalledTimes(2);
    });

    it("should correctly call `onInstanceCreation` if specified multiple times", () => {
      const onInstanceCreation = jest.fn<void, [A]>();

      @scoped({
        onInstanceCreation
      })
      @scoped({
        onInstanceCreation
      })
      @scoped({
        onInstanceCreation
      })
      class A {}

      const a1 = new A();
      expect(onInstanceCreation).toHaveBeenNthCalledWith(1, a1);
      expect(onInstanceCreation).toHaveBeenNthCalledWith(2, a1);
      expect(onInstanceCreation).toHaveBeenNthCalledWith(3, a1);

      const a2 = new A();
      expect(onInstanceCreation).toHaveBeenNthCalledWith(4, a2);
      expect(onInstanceCreation).toHaveBeenNthCalledWith(5, a2);
      expect(onInstanceCreation).toHaveBeenNthCalledWith(6, a2);

      expect(onInstanceCreation).toHaveBeenCalledTimes(6);
    });

    it("should correctly call `onInstanceCreation` for inherited classes", () => {
      const onInstanceCreationBase = jest.fn<void, [ABase]>();
      const onInstanceCreationChild = jest.fn<void, [ABase]>();

      @scoped({
        onInstanceCreation: onInstanceCreationBase
      })
      abstract class ABase {}

      @scoped({
        onInstanceCreation: onInstanceCreationChild
      })
      class AChild1 extends ABase {}

      class AChild2 extends ABase {}

      const a1 = new AChild1();
      expect(onInstanceCreationBase).toHaveBeenNthCalledWith(1, a1);
      expect(onInstanceCreationChild).toHaveBeenNthCalledWith(1, a1);

      const a2 = new AChild2();

      expect(onInstanceCreationBase).toHaveBeenNthCalledWith(2, a2);

      expect(onInstanceCreationBase).toHaveBeenCalledTimes(2);
      expect(onInstanceCreationChild).toHaveBeenCalledTimes(1);
    });
  });

  describe("attachDependency", () => {
    it("should be able to attach dependency outside constructor", () => {
      @scoped()
      class Child {}

      @scoped()
      class Parent {}

      const parent = new Parent();
      expect(listScopes(parent)).toMatchObject([{ id: null, name: "Parent" }]);

      const child = new Child();
      expect(listScopes(child)).toMatchObject([{ id: null, name: "Child" }]);

      attachDependency(parent, child);
      expect(listScopes(child)).toMatchObject([
        { id: null, name: "Parent" },
        { id: null, name: "Child" }
      ]);
    });

    it("should throw if parent hasn't been decorated with scoped", () => {
      @scoped()
      class Child {}

      const parent = {};
      const child = new Child();
      expect(() => attachDependency(parent, child)).toThrowError(
        `Parent instance is not a scopedDependency!`
      );
    });

    it("should throw if child hasn't been decorated with scoped", () => {
      @scoped()
      class Parent {}

      const parent = new Parent();
      const child = {};
      expect(() => attachDependency(parent, child)).toThrowError(
        `Child instance is not a scopedDependency!`
      );
    });

    it("should throw if child already has attached parent", () => {
      @scoped()
      class Child {}

      @scoped()
      class Parent {}

      const parent1 = new Parent();
      const parent2 = new Parent();
      const child = new Child();

      expect(() => attachDependency(parent1, child)).not.toThrow();
      expect(() => attachDependency(parent2, child)).toThrowError(
        "Child instance already has set parent!"
      );
    });
  });

  describe("listScopes", () => {
    it("should return empty array for non scoped instances", () => {
      class NonScoped {}

      expect(() => listScopes(new NonScoped())).not.toThrowError();
      expect(listScopes(new NonScoped())).toMatchObject([]);
    });

    it("should return correct results", () => {
      @scoped({ name: "I_AM_D" })
      class D {
        public id = getNextId("D");
      }

      @scoped()
      class C {
        public id = getNextId("C");

        public readonly d = new D();
      }

      @scoped()
      class B {
        public readonly c1 = new C();
        public readonly c2 = new C();
        public readonly c3 = new C();
      }

      @scoped({ name: "I_AM_A" })
      class A {
        public id = getNextId("A");

        public b1 = new B();
        public b2 = new B();
      }

      const a1 = new A();

      expect(listScopes(a1)).toMatchObject([{ id: 0, name: "I_AM_A" }]);

      expect(listScopes(a1.b1)).toMatchObject([{ id: 0, name: "I_AM_A" }, { id: null, name: "B" }]);

      expect(listScopes(a1.b1.c1)).toMatchObject([
        { id: 0, name: "I_AM_A" },
        { id: null, name: "B" },
        { id: 0, name: "C" }
      ]);
      expect(listScopes(a1.b1.c2)).toMatchObject([
        { id: 0, name: "I_AM_A" },
        { id: null, name: "B" },
        { id: 1, name: "C" }
      ]);
      expect(listScopes(a1.b1.c3)).toMatchObject([
        { id: 0, name: "I_AM_A" },
        { id: null, name: "B" },
        { id: 2, name: "C" }
      ]);

      expect(listScopes(a1.b1.c1.d)).toMatchObject([
        { id: 0, name: "I_AM_A" },
        { id: null, name: "B" },
        { id: 0, name: "C" },
        { id: 0, name: "I_AM_D" }
      ]);
      expect(listScopes(a1.b1.c2.d)).toMatchObject([
        { id: 0, name: "I_AM_A" },
        { id: null, name: "B" },
        { id: 1, name: "C" },
        { id: 1, name: "I_AM_D" }
      ]);
      expect(listScopes(a1.b1.c3.d)).toMatchObject([
        { id: 0, name: "I_AM_A" },
        { id: null, name: "B" },
        { id: 2, name: "C" },
        { id: 2, name: "I_AM_D" }
      ]);

      //

      expect(listScopes(a1.b2)).toMatchObject([{ id: 0, name: "I_AM_A" }, { id: null, name: "B" }]);

      expect(listScopes(a1.b2.c1)).toMatchObject([
        { id: 0, name: "I_AM_A" },
        { id: null, name: "B" },
        { id: 3, name: "C" }
      ]);
      expect(listScopes(a1.b2.c2)).toMatchObject([
        { id: 0, name: "I_AM_A" },
        { id: null, name: "B" },
        { id: 4, name: "C" }
      ]);
      expect(listScopes(a1.b2.c3)).toMatchObject([
        { id: 0, name: "I_AM_A" },
        { id: null, name: "B" },
        { id: 5, name: "C" }
      ]);

      expect(listScopes(a1.b2.c1.d)).toMatchObject([
        { id: 0, name: "I_AM_A" },
        { id: null, name: "B" },
        { id: 3, name: "C" },
        { id: 3, name: "I_AM_D" }
      ]);
      expect(listScopes(a1.b2.c2.d)).toMatchObject([
        { id: 0, name: "I_AM_A" },
        { id: null, name: "B" },
        { id: 4, name: "C" },
        { id: 4, name: "I_AM_D" }
      ]);
      expect(listScopes(a1.b2.c3.d)).toMatchObject([
        { id: 0, name: "I_AM_A" },
        { id: null, name: "B" },
        { id: 5, name: "C" },
        { id: 5, name: "I_AM_D" }
      ]);
    });
  });
});
