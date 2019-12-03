import {
  registerDependencyPath,
  getNamespacesList,
  setNamespaceName
} from "./dependency-path-helpers";

describe("dependency-path", () => {
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

  describe("registerDependencyPath", () => {
    it("should work without any children dependencies", () => {
      @registerDependencyPath()
      class A {
        public static someStatic: number = 123;
      }

      const a = new A();

      expect(getNamespacesList(a)).toMatchObject([{ id: null, namespace: "A" }]);
    });

    it("should work with single child dependency", () => {
      @registerDependencyPath()
      class B {}

      @registerDependencyPath()
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

    it("should work with complicated children structure", () => {
      @registerDependencyPath()
      class D {
        private id = getNextId("d");
      }

      @registerDependencyPath()
      class C {
        private id = getNextId("c");
        public d1 = new D();
        public d2 = new D();
        public d3 = new D();
      }

      @registerDependencyPath()
      class B {
        private id = getNextId("b");
        public c = new C();
      }

      @registerDependencyPath()
      class A {
        private id = getNextId("a");
        public b1 = new B();
        public b2 = new B();
      }

      const a = new A();

      // a
      expect(getNamespacesList(a)).toMatchObject([{ id: 0, namespace: "A" }]);

      // a.b*
      expect(getNamespacesList(a.b1)).toMatchObject([
        { id: 0, namespace: "A" },
        { id: 0, namespace: "B" }
      ]);
      expect(getNamespacesList(a.b2)).toMatchObject([
        { id: 0, namespace: "A" },
        { id: 1, namespace: "B" }
      ]);

      // a.b*.c
      expect(getNamespacesList(a.b1.c)).toMatchObject([
        { id: 0, namespace: "A" },
        { id: 0, namespace: "B" },
        { id: 0, namespace: "C" }
      ]);
      expect(getNamespacesList(a.b2.c)).toMatchObject([
        { id: 0, namespace: "A" },
        { id: 1, namespace: "B" },
        { id: 1, namespace: "C" }
      ]);

      // a.b1.c.d*
      expect(getNamespacesList(a.b1.c.d1)).toMatchObject([
        { id: 0, namespace: "A" },
        { id: 0, namespace: "B" },
        { id: 0, namespace: "C" },
        { id: 0, namespace: "D" }
      ]);
      expect(getNamespacesList(a.b1.c.d2)).toMatchObject([
        { id: 0, namespace: "A" },
        { id: 0, namespace: "B" },
        { id: 0, namespace: "C" },
        { id: 1, namespace: "D" }
      ]);
      expect(getNamespacesList(a.b1.c.d3)).toMatchObject([
        { id: 0, namespace: "A" },
        { id: 0, namespace: "B" },
        { id: 0, namespace: "C" },
        { id: 2, namespace: "D" }
      ]);

      // a.b2.c.d*
      expect(getNamespacesList(a.b2.c.d1)).toMatchObject([
        { id: 0, namespace: "A" },
        { id: 1, namespace: "B" },
        { id: 1, namespace: "C" },
        { id: 3, namespace: "D" }
      ]);
      expect(getNamespacesList(a.b2.c.d2)).toMatchObject([
        { id: 0, namespace: "A" },
        { id: 1, namespace: "B" },
        { id: 1, namespace: "C" },
        { id: 4, namespace: "D" }
      ]);
      expect(getNamespacesList(a.b2.c.d3)).toMatchObject([
        { id: 0, namespace: "A" },
        { id: 1, namespace: "B" },
        { id: 1, namespace: "C" },
        { id: 5, namespace: "D" }
      ]);
    });

    it("should call registerDependencyPath::onInstanceCreation if specified", () => {
      const onInstanceCreation = jest.fn();

      @registerDependencyPath({
        onInstanceCreation
      })
      class A {
        public static someStatic: number = 123;
      }

      const a = new A();

      expect(getNamespacesList(a)).toMatchObject([{ id: null, namespace: "A" }]);
      expect(onInstanceCreation).toHaveBeenCalled();
    });

    describe("inheritance", () => {
      it("should work with simple example", () => {
        @registerDependencyPath()
        class B {}

        @registerDependencyPath()
        abstract class AParent {}

        @registerDependencyPath()
        class AChild extends AParent {
          public b = new B();
        }

        const a = new AChild();

        expect(getNamespacesList(a)).toMatchObject([{ id: null, namespace: "AChild" }]);
        expect(getNamespacesList(a.b)).toMatchObject([
          { id: null, namespace: "AChild" },
          { id: null, namespace: "B" }
        ]);
      });

      it("should work with namespaces", () => {
        @setNamespaceName("B_NSP")
        @registerDependencyPath()
        class B {}

        @setNamespaceName("AParent_NSP")
        @registerDependencyPath()
        abstract class AParent {}

        @setNamespaceName("AChild_NSP")
        @registerDependencyPath()
        class AChild extends AParent {
          public b = new B();
        }

        const a = new AChild();

        expect(getNamespacesList(a)).toMatchObject([{ id: null, namespace: "AChild_NSP" }]);
        expect(getNamespacesList(a.b)).toMatchObject([
          { id: null, namespace: "AChild_NSP" },
          { id: null, namespace: "B_NSP" }
        ]);
      });

      it("should work with namespaces and ids", () => {
        @setNamespaceName("B_NSP")
        @registerDependencyPath()
        class B {
          private id = getNextId("b");
        }

        @setNamespaceName("AParent_NSP")
        @registerDependencyPath()
        abstract class AParent {
          protected id = getNextId("aParent") + "_aParent";
        }

        @setNamespaceName("AChild_NSP")
        @registerDependencyPath()
        class AChild extends AParent {
          protected id = getNextId("aChild") + "_aChild";

          public b = new B();
        }

        const a = new AChild();

        expect(getNamespacesList(a)).toMatchObject([{ id: "0_aChild", namespace: "AChild_NSP" }]);
        expect(getNamespacesList(a.b)).toMatchObject([
          { id: "0_aChild", namespace: "AChild_NSP" },
          { id: 0, namespace: "B_NSP" }
        ]);
      });
    });
  });

  describe("setNamespaceName", () => {
    it("should use overridden namespace name instead of class name", () => {
      @setNamespaceName("B-namespace")
      @registerDependencyPath()
      class B {
        private id = getNextId("b");
        public static someStatic: number = 123;
      }

      @setNamespaceName("A-namespace")
      @registerDependencyPath()
      class A {
        public b = new B();
      }

      const a = new A();
      const b = new B();

      expect(getNamespacesList(a)).toMatchObject([{ id: null, namespace: "A-namespace" }]);
      expect(getNamespacesList(a.b)).toMatchObject([
        { id: null, namespace: "A-namespace" },
        { id: 0, namespace: "B-namespace" }
      ]);
      expect(getNamespacesList(b)).toMatchObject([{ id: 1, namespace: "B-namespace" }]);
    });

    it("should work with inheritance", () => {
      @setNamespaceName("BaseClass-namespace")
      @registerDependencyPath()
      class BaseClass {}

      @setNamespaceName("ChildClass-namespace")
      @registerDependencyPath()
      class ChildClass {
        protected id = getNextId("ChildClass");
      }

      @setNamespaceName("Child1-namespace")
      @registerDependencyPath()
      class Child1 extends ChildClass {}

      @setNamespaceName("Child2-namespace")
      @registerDependencyPath()
      class Child2 extends ChildClass {}

      expect(getNamespacesList(new Child2())).toMatchObject([
        {
          id: 0,
          namespace: "Child2-namespace"
        }
      ]);
      expect(getNamespacesList(new Child1())).toMatchObject([
        {
          id: 1,
          namespace: "Child1-namespace"
        }
      ]);
      expect(getNamespacesList(new BaseClass())).toMatchObject([
        {
          id: null,
          namespace: "BaseClass-namespace"
        }
      ]);
      expect(getNamespacesList(new Child1())).toMatchObject([
        {
          id: 2,
          namespace: "Child1-namespace"
        }
      ]);
      expect(getNamespacesList(new Child2())).toMatchObject([
        {
          id: 3,
          namespace: "Child2-namespace"
        }
      ]);
    });
  });

  describe("getNamespacesList", () => {
    it("should throw if called on aaa", () => {
      class A {}
      expect(() => getNamespacesList(new A())).toThrowError(
        'Cannot get namespace list for class(A) because it hasn\'t been decorated with "useDependencyPathInstance"!'
      );
    });
  });
});
