import { listScopes, scoped } from "./scoped-dependency";

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
      expect(listScopes(a.b)).toMatchObject([
        { id: null, name: "A" },
        { id: null, name: "B" }
      ]);
      expect(listScopes(a.b.c)).toMatchObject([
        { id: null, name: "A" },
        { id: null, name: "B" },
        { id: null, name: "C" }
      ]);
    });

    it("shouldn't work with (non decorated) inherited classes", () => {
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

      expect(listScopes(a1)).toMatchObject([]);
      expect(listScopes(a1.b)).toMatchObject([{ id: null, name: "B" }]);
      expect(listScopes(a1.b.c)).toMatchObject([
        { id: null, name: "B" },
        { id: null, name: "C" }
      ]);

      const a2 = new AChild2();
      expect(listScopes(a2)).toMatchObject([]);
      expect(listScopes(a2.b)).toMatchObject([{ id: null, name: "B" }]);
      expect(listScopes(a2.b.c)).toMatchObject([
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

    it.skip("should correctly alter name in case of inheritance", () => {
      @scoped({ name: "A_BASE" })
      abstract class ABase {}

      @scoped({ name: "A_CHILD_1" })
      class AChild1 extends ABase {}

      @scoped()
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

      expect(listScopes(a1.b1)).toMatchObject([
        { id: 0, name: "I_AM_A" },
        { id: null, name: "B" }
      ]);

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

      expect(listScopes(a1.b2)).toMatchObject([
        { id: 0, name: "I_AM_A" },
        { id: null, name: "B" }
      ]);

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
