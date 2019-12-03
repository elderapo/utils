import { registerDependencyPath, getNamespacesList } from "./dependency-path-helpers";

describe("dependency-path", () => {
  describe("registerDependencyPath", () => {
    it("should work without any children dependencies", () => {
      @registerDependencyPath()
      class A {}

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
      // tslint:disable:variable-name
      let nextA_ID = 0;
      let nextB_ID = 0;
      let nextC_ID = 0;
      let nextD_ID = 0;
      // tslint:enable:variable-name

      @registerDependencyPath()
      class D {
        private id = nextD_ID++;
      }

      @registerDependencyPath()
      class C {
        private id = nextC_ID++;
        public d1 = new D();
        public d2 = new D();
        public d3 = new D();
      }

      @registerDependencyPath()
      class B {
        private id = nextB_ID++;
        public c = new C();
      }

      @registerDependencyPath()
      class A {
        private id = nextA_ID++;
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
