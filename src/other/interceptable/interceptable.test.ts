require("reflect-metadata");

import { Container, Service } from "typedi";
import { sleep } from "../../timers";
import { IInterceptableOptions, interceptable } from "./interceptable";
import { InterceptableContext, InterceptableContextType } from "./InterceptableContext";

describe("interceptable", () => {
  const createMocks = <T extends Object, R extends Required<IInterceptableOptions<T>>>(
    options: {
      onSet?: R["set"];
      onGet?: R["get"];
      onAfterConstruct?: R["afterConstruct"];
      onDefineProperty?: R["defineProperty"];
      onDeleteProperty?: R["deleteProperty"];
    } = {}
  ) => {
    const set = jest.fn<void, Parameters<R["set"]>>((target, key, value, isInternal) => {
      if (options.onSet) {
        options.onSet(target, key, value as any, isInternal);
      }
    });

    const get = jest.fn<ReturnType<R["get"]>, Parameters<R["get"]>>(
      (target, key, suggestedValue, isInternal) => {
        if (options.onGet) {
          return options.onGet(target, key, suggestedValue as any, isInternal);
        }

        return suggestedValue as any;
      }
    );

    const afterConstruct = jest.fn<void, Parameters<R["afterConstruct"]>>(target => {
      if (options.onAfterConstruct) {
        options.onAfterConstruct(target);
      }
    });

    const defineProperty = jest.fn<void, Parameters<R["defineProperty"]>>(
      (target, key, descriptor, isInternal) => {
        if (options.onDefineProperty) {
          options.onDefineProperty(target, key, descriptor, isInternal);
        }
      }
    );

    const deleteProperty = jest.fn<void, Parameters<R["deleteProperty"]>>(
      (target, key, isInternal) => {
        if (options.onDeleteProperty) {
          options.onDeleteProperty(target, key, isInternal);
        }
      }
    );

    return { set, get, afterConstruct, defineProperty, deleteProperty };
  };

  describe("basic functionality", () => {
    it("shouldn't affect object behaviour if options are empty", () => {
      @interceptable({})
      class A {
        public n: number = 100;
        public nnn!: number;

        public defineNNN(): void {
          Object.defineProperty(this, "nnn", {
            writable: true,
            value: 999
          });
        }

        public get numberGetter() {
          return this.n;
        }

        public set numberSetter(n: number) {
          this.n = n;
        }

        public setNumber(n: number): void {
          this.n = n;
        }

        public getNumber(): number {
          return this.n;
        }

        public deleteNumber(): void {
          delete this.n;
        }
      }

      const a = new A();

      expect(a.nnn).toBe(undefined);
      a.defineNNN();
      expect(a.nnn).toBe(999);

      expect(a.n).toBe(100);
      a.numberSetter = 123;
      expect(a.numberGetter).toBe(123);

      delete a.n;
      expect(a.n).toBe(undefined);

      a.setNumber(666);
      expect(a.getNumber()).toBe(666);

      a.deleteNumber();
      expect(a.n).toBe(undefined);
    });

    it("should correctly call options.afterConstruct", () => {
      const mocks = createMocks<A, Required<IInterceptableOptions<A>>>();

      @interceptable(mocks)
      class A {
        public a: string = "a";
      }

      const a1 = new A();
      const a2 = new A();

      expect(mocks.afterConstruct).toHaveBeenNthCalledWith(1, a1);
      expect(mocks.afterConstruct).toHaveBeenNthCalledWith(2, a2);

      expect(mocks.afterConstruct).toHaveBeenCalledTimes(2);
    });

    it("should correctly call options.set", () => {
      const mocks = createMocks<A, Required<IInterceptableOptions<A>>>();

      @interceptable(mocks)
      class A {
        public a: string = "a";
      }

      const a1 = new A();
      const a2 = new A();

      expect(mocks.set).toHaveBeenNthCalledWith(1, a1, "a", "a", true);
      expect(mocks.set).toHaveBeenNthCalledWith(2, a2, "a", "a", true);

      a1.a = "aaa";
      a2.a = "bbb";

      expect(mocks.set).toHaveBeenNthCalledWith(3, a1, "a", "aaa", false);
      expect(mocks.set).toHaveBeenNthCalledWith(4, a2, "a", "bbb", false);

      expect(mocks.set).toHaveBeenCalledTimes(4);
    });

    it("should correctly call options.get", () => {
      const mocks = createMocks<A, Required<IInterceptableOptions<A>>>();

      @interceptable(mocks)
      class A {
        constructor(private a: string) {}

        public internallyAccessA() {
          // tslint:disable-next-line: no-unused-expression
          this.a;
        }
      }

      const a1 = new A("a1");
      const a2 = new A("a2");

      expect(mocks.get).toHaveBeenCalledTimes(0);
      a1.internallyAccessA();
      expect(mocks.get).toHaveBeenCalledTimes(2);
      a2.internallyAccessA();
      expect(mocks.get).toHaveBeenCalledTimes(4);

      expect(mocks.get).toHaveBeenNthCalledWith(1, a1, "internallyAccessA", expect.anything(), false); // prettier-ignore
      expect(mocks.get).toHaveBeenNthCalledWith(2, a1, "a", "a1", true);
      expect(mocks.get).toHaveBeenNthCalledWith(3, a2, "internallyAccessA", expect.anything(), false); // prettier-ignore
      expect(mocks.get).toHaveBeenNthCalledWith(4, a2, "a", "a2", true);
    });

    it("should correctly call options.defineProperty", () => {
      let override = true;

      const mocks = createMocks<A, Required<IInterceptableOptions<A>>>({
        onDefineProperty: (target, key, descriptor, isInternal) => {
          Object.defineProperty(
            target,
            key,
            override
              ? {
                  ...descriptor,
                  get: () => {
                    return 666;
                  }
                }
              : descriptor
          );
        }
      });

      @interceptable(mocks)
      class A {
        public get sampleGetter() {
          return 123;
        }
      }

      const a = new A();
      expect(a.sampleGetter).toBe(666);

      Object.defineProperty(a, "sampleGetter", {
        get: () => 123
      });

      expect(a.sampleGetter).toBe(666);
      override = false;

      Object.defineProperty(a, "sampleGetter", {
        get: () => 333
      });

      expect(a.sampleGetter).toBe(333);
    });

    it("should correctly call options.deleteProperty", () => {
      const mocks = createMocks<A, Required<IInterceptableOptions<A>>>();

      @interceptable(mocks)
      class A {
        public aForInternalDeletion: string = "a";
        public bForInternalDeletion: number = 123;

        public aForExternalDeletion: string = "a";
        public bForExternalDeletion: number = 123;

        public delete() {
          delete this.aForInternalDeletion;
          delete this.bForInternalDeletion;
        }
      }

      const a = new A();

      expect(mocks.deleteProperty).toHaveBeenCalledTimes(0);

      a.delete();

      expect(mocks.deleteProperty).toHaveBeenNthCalledWith(1, a, "aForInternalDeletion", true);
      expect(mocks.deleteProperty).toHaveBeenNthCalledWith(2, a, "bForInternalDeletion", true);

      expect(mocks.deleteProperty).toHaveBeenCalledTimes(2);

      delete a.aForExternalDeletion;
      delete a.bForExternalDeletion;

      expect(mocks.deleteProperty).toHaveBeenNthCalledWith(3, a, "aForExternalDeletion", false);
      expect(mocks.deleteProperty).toHaveBeenNthCalledWith(4, a, "bForExternalDeletion", false);

      expect(mocks.deleteProperty).toHaveBeenCalledTimes(4);
    });

    it("should ignore previous options for classes decorated multiple times with `interceptable`", () => {
      const mocks1 = createMocks<A, Required<IInterceptableOptions<A>>>();
      const mocks2 = createMocks<A, Required<IInterceptableOptions<A>>>();

      @interceptable(mocks2)
      @interceptable(mocks1)
      class A {
        public a: string = "a";

        public internallySetA(newA: string): void {
          this.a = newA;
        }

        public internallyAccessA() {
          // tslint:disable-next-line: no-unused-expression
          this.a;
        }
      }

      const a = new A();

      expect(mocks2.afterConstruct).toHaveBeenNthCalledWith(1, a);
      expect(mocks2.set).toHaveBeenNthCalledWith(1, a, "a", "a", true);

      a.internallyAccessA();
      a.internallySetA("fffff");
      a.a = "ffsdfsf";
      // tslint:disable-next-line: no-unused-expression
      a.a;

      expect(mocks1.afterConstruct).not.toHaveBeenCalled();
      expect(mocks1.set).not.toHaveBeenCalled();
      expect(mocks1.get).not.toHaveBeenCalled();
    });
  });

  describe("internal/external events", () => {
    it("assigments inside class constructor should cause internal set events", () => {
      expect.assertions(4);

      const mocks = createMocks<A, Required<IInterceptableOptions<A>>>({});

      @interceptable(mocks)
      class A {
        public a: number = 123;
        public b: string = "bbb";
        public c: boolean;

        public constructor() {
          this.c = false;

          /*
           * This is temporary. Depending if on the chosen construction option context type
           * at this stage can be either null or internal.
           */

          const type = InterceptableContext.getContextType(this);
          expect(type === InterceptableContextType.Internal || type === null).toBe(true);
        }
      }

      const a = new A();

      expect(mocks.set).toHaveBeenNthCalledWith(1, a, "a", 123, true);
      expect(mocks.set).toHaveBeenNthCalledWith(2, a, "b", "bbb", true);
      expect(mocks.set).toHaveBeenNthCalledWith(3, a, "c", false, true);
    });

    it("assigments inside class methods should cause internal set events", () => {
      expect.assertions(3);

      const mocks = createMocks<A, Required<IInterceptableOptions<A>>>({});

      @interceptable(mocks)
      class A {
        public a?: number;
        public b?: string;

        public setValues(a: number, b: string): void {
          this.a = a;
          this.b = b;

          expect(InterceptableContext.getContextType(this)).toBe(InterceptableContextType.Internal);
        }
      }

      const a = new A();

      a.setValues(123, "bbb");

      expect(mocks.set).toHaveBeenNthCalledWith(1, a, "a", 123, true);
      expect(mocks.set).toHaveBeenNthCalledWith(2, a, "b", "bbb", true);
    });

    it("assigments inside async class methods should cause internal set events", async () => {
      expect.assertions(4);

      const mocks = createMocks<A, Required<IInterceptableOptions<A>>>({});

      @interceptable(mocks)
      class A {
        public a?: number;
        public b?: string;

        public async setValues(a: number, b: string): Promise<void> {
          await sleep(50);
          this.a = a;
          await sleep(50);
          this.b = b;
          await sleep(50);

          expect(InterceptableContext.getContextType(this)).toBe(InterceptableContextType.Internal);
        }
      }

      const a = new A();

      await expect(a.setValues(123, "bbb")).resolves.not.toThrow();

      expect(mocks.set).toHaveBeenNthCalledWith(1, a, "a", 123, true);
      expect(mocks.set).toHaveBeenNthCalledWith(2, a, "b", "bbb", true);
    });

    it("delayed (from timers, nested promises etc) assigments inside class methods should still cause iternal events", async () => {
      expect.assertions(8);

      const mocks = createMocks<A, Required<IInterceptableOptions<A>>>({});

      @interceptable(mocks)
      class A {
        public a?: number;
        public b?: string;

        public setValuesInsidePromise(a: number, b: string): Promise<void> {
          return new Promise<void>(async resolve => {
            await sleep(50);
            this.a = a;
            await sleep(50);
            this.b = b;
            await sleep(50);

            expect(InterceptableContext.getContextType(this)).toBe(
              InterceptableContextType.Internal
            );

            return resolve();
          });
        }

        public setValuesInsideTimer(a: number, b: string): void {
          setTimeout(() => {
            this.a = a;
            this.b = b;

            expect(InterceptableContext.getContextType(this)).toBe(
              InterceptableContextType.Internal
            );
          }, 10);
        }
      }

      const a = new A();

      await expect(a.setValuesInsidePromise(123, "bbb")).resolves.not.toThrow();

      expect(mocks.set).toHaveBeenNthCalledWith(1, a, "a", 123, true);
      expect(mocks.set).toHaveBeenNthCalledWith(2, a, "b", "bbb", true);

      expect(a.setValuesInsideTimer(666, "abc")).toBe(undefined);

      await sleep(50);

      expect(mocks.set).toHaveBeenNthCalledWith(3, a, "a", 666, true);
      expect(mocks.set).toHaveBeenNthCalledWith(4, a, "b", "abc", true);
    });

    it("assigments outside class should cause external set events", () => {
      const mocks = createMocks<A, Required<IInterceptableOptions<A>>>({});

      @interceptable(mocks)
      class A {
        public a?: number;
        public b?: string;
      }

      const a = new A();

      a.a = 123123123;
      a.b = "abc";

      expect(mocks.set).toHaveBeenNthCalledWith(1, a, "a", 123123123, false);
      expect(mocks.set).toHaveBeenNthCalledWith(2, a, "b", "abc", false);
    });
  });

  describe("functions as class properties", () => {
    it("setting functions as class properties from constructor should always raise an error", () => {
      const mocks = createMocks<
        ClassWithNormalFN,
        Required<IInterceptableOptions<ClassWithNormalFN>>
      >({});

      @interceptable(mocks)
      class ClassWithNormalFN {
        // tslint:disable-next-line: no-empty
        public setValuesNormal = function(): void {};
      }

      @interceptable(mocks)
      class ClassWithArrowFN {
        // tslint:disable-next-line: no-empty
        public setValuesArrow = (): void => {};
      }

      expect(() => new ClassWithArrowFN()).toThrowError();
      expect(() => new ClassWithArrowFN()).toThrowError();
    });

    it("setting functions as class properties dynamically should only be allowed if `allowDynamicFunctionAssigments` has been provided, else raise error", () => {
      const mocks = createMocks<ADisallowed, Required<IInterceptableOptions<ADisallowed>>>({});

      @interceptable(mocks)
      class ADisallowed {
        public normalFunction?: Function;
        public arrowFunction?: Function;
      }

      @interceptable({
        ...mocks,
        allowDynamicFunctionAssigments: true
      })
      class AAllowed {
        public normalFunction?: Function;
        public arrowFunction?: Function;
      }

      const aDisallowed = new ADisallowed();

      expect(() => {
        // tslint:disable-next-line: no-empty
        aDisallowed.arrowFunction = () => {};
      }).toThrowError();
      expect(() => {
        // tslint:disable-next-line: no-empty
        aDisallowed.normalFunction = function() {};
      }).toThrowError();

      const aAllowed = new AAllowed();

      expect(() => {
        // tslint:disable-next-line: no-empty
        aAllowed.arrowFunction = () => {};
      }).not.toThrowError();
      expect(() => {
        // tslint:disable-next-line: no-empty
        aAllowed.normalFunction = function() {};
      }).not.toThrowError();
    });
  });

  describe("inheritenance", () => {
    describe("parent(interceptable) => child(non interceptable)", () => {
      it("should work correctly with instanceof operator", () => {
        const parentMocks = createMocks<Parent, Required<IInterceptableOptions<Parent>>>();

        @interceptable(parentMocks)
        class Parent {
          public p: string = "parent";
        }

        class Child extends Parent {
          public c: string = "child";
        }

        const p = new Parent();
        const c = new Child();

        expect(p).toBeInstanceOf(Object);
        expect(p).toBeInstanceOf(Parent);
        expect(p).not.toBeInstanceOf(Child);

        expect(c).toBeInstanceOf(Object);
        expect(c).toBeInstanceOf(Parent);
        expect(c).toBeInstanceOf(Child);
      });

      it("intercetable metadata from parent should not affect children", () => {
        const parentMocks = createMocks<Parent, Required<IInterceptableOptions<Parent>>>();

        @interceptable(parentMocks)
        class Parent {
          public p: string = "parent";
        }

        class Child extends Parent {
          public c: string = "child";
        }

        const p = new Parent();
        expect(parentMocks.afterConstruct).toHaveBeenNthCalledWith(1, p);

        const c = new Child();

        expect(parentMocks.afterConstruct).toHaveBeenCalledTimes(1);
      });
    });

    describe("parent(interceptable) => child(interceptable)", () => {
      it("should work correctly with instanceof operator", () => {
        const parentMocks = createMocks<Parent, Required<IInterceptableOptions<Parent>>>();
        const childMocks = createMocks<Child, Required<IInterceptableOptions<Child>>>();

        @interceptable(parentMocks)
        class Parent {
          public p: string = "parent";
        }

        @interceptable(childMocks)
        class Child extends Parent {
          public c: string = "child";
        }

        const p = new Parent();
        const c = new Child();

        expect(p).toBeInstanceOf(Object);
        expect(p).toBeInstanceOf(Parent);
        expect(p).not.toBeInstanceOf(Child);

        expect(c).toBeInstanceOf(Object);
        expect(c).toBeInstanceOf(Parent);
        expect(c).toBeInstanceOf(Child);
      });

      it("intercetable metadata from parent should not affect children", () => {
        const parentMocks = createMocks<Parent, Required<IInterceptableOptions<Parent>>>();
        const childMocks = createMocks<Child, Required<IInterceptableOptions<Child>>>();

        @interceptable(parentMocks)
        class Parent {
          public p: string = "parent";
        }

        @interceptable(childMocks)
        class Child extends Parent {
          public c: string = "child";
        }

        const p = new Parent();
        expect(parentMocks.afterConstruct).toHaveBeenNthCalledWith(1, p);

        const c = new Child();

        expect(parentMocks.afterConstruct).toHaveBeenCalledTimes(1);
        expect(childMocks.afterConstruct).toHaveBeenNthCalledWith(1, c);

        expect(parentMocks.set).toHaveBeenNthCalledWith(1, p, "p", "parent", true);
        p.p = "PPP";
        expect(parentMocks.set).toHaveBeenNthCalledWith(2, p, "p", "PPP", false);

        expect(childMocks.set).toHaveBeenNthCalledWith(1, c, "p", "parent", true);
        expect(childMocks.set).toHaveBeenNthCalledWith(2, c, "c", "child", true);
        c.p = "PPP";
        c.c = "CCC";
        expect(childMocks.set).toHaveBeenNthCalledWith(3, c, "p", "PPP", false);
        expect(childMocks.set).toHaveBeenNthCalledWith(4, c, "c", "CCC", false);

        expect(parentMocks.set).toHaveBeenCalledTimes(2);
        expect(childMocks.set).toHaveBeenCalledTimes(4);
      });
    });

    describe("parent(non interceptable) => child(interceptable)", () => {
      it("should work correctly with instanceof operator", () => {
        const childMocks = createMocks<Parent, Required<IInterceptableOptions<Parent>>>();

        class Parent {
          public p: string = "parent";
        }

        @interceptable(childMocks)
        class Child extends Parent {
          public c: string = "child";
        }

        const p = new Parent();
        const c = new Child();

        expect(p).toBeInstanceOf(Object);
        expect(p).toBeInstanceOf(Parent);
        expect(p).not.toBeInstanceOf(Child);

        expect(c).toBeInstanceOf(Object);
        expect(c).toBeInstanceOf(Parent);
        expect(c).toBeInstanceOf(Child);
      });

      it("intercetable metadata from children should not affect parent", () => {
        const childMocks = createMocks<Parent, Required<IInterceptableOptions<Parent>>>();

        class Parent {
          public p: string = "parent";
        }

        @interceptable(childMocks)
        class Child extends Parent {
          public c: string = "child";
        }

        const p = new Parent();
        expect(childMocks.afterConstruct).not.toHaveBeenCalled();
        p.p = "adasda";
        expect(childMocks.afterConstruct).not.toHaveBeenCalled();

        const c = new Child();

        expect(childMocks.afterConstruct).toHaveBeenNthCalledWith(1, c);
        expect(childMocks.afterConstruct).toHaveBeenCalledTimes(1);

        expect(childMocks.set).toHaveBeenNthCalledWith(1, c, "p", "parent", true);
        expect(childMocks.set).toHaveBeenNthCalledWith(2, c, "c", "child", true);
        c.p = "PPP";
        c.c = "CCC";

        expect(childMocks.set).toHaveBeenNthCalledWith(3, c, "p", "PPP", false);
        expect(childMocks.set).toHaveBeenNthCalledWith(4, c, "c", "CCC", false);

        expect(childMocks.set).toHaveBeenCalledTimes(4);
      });
    });
  });

  describe("examples", () => {
    it.only("typedi example(1)", () => {
      let nextB = 0;
      let nextA = 0;

      @Service({ global: true })
      @interceptable({})
      class ServiceB {
        public id = nextB++;
        public bbb: string = "bbb";
      }

      @Service({ transient: true })
      @interceptable({})
      class ServiceA {
        public id = nextA++;
        public aaa: string = "aaa";
      }

      @Service({ transient: true })
      @interceptable({})
      class MainService {
        constructor(
          public a1: ServiceA,
          public a2: ServiceA,
          public b1: ServiceB,
          public b2: ServiceB
        ) {}
      }

      const main = Container.get(MainService);

      console.log(main);

      expect(main.a1).toMatchObject({ id: 0, aaa: "aaa" });
      expect(main.a2).toMatchObject({ id: 1, aaa: "aaa" });

      expect(main.b1).toMatchObject({ id: 0, bbb: "bbb" });
      expect(main.b2).toMatchObject({ id: 0, bbb: "bbb" });

      expect(main.a1).toBeInstanceOf(ServiceA);
      expect(main.a2).toBeInstanceOf(ServiceA);
      expect(main.a1).not.toBe(main.a2);

      expect(main.b1).toBeInstanceOf(ServiceB);
      expect(main.b2).toBeInstanceOf(ServiceB);
      expect(main.b1).toBe(main.b2);
    });
  });
});
