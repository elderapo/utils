import { IInterceptableOptions, interceptable } from "./interceptable";
import { InterceptableContext, InterceptableContextType } from "./InterceptableContext";
import { sleep } from "../../timers";

/*
 *
 * @TODO:
 * - Add `Object.defineProperty(...)` tests.
 * - Add getter/setters tests.
 * - Add support for other "proxable" actions (on delete, initialize?).
 *
 */

describe("interceptable", () => {
  const createMocks = <T extends Object, R extends Required<IInterceptableOptions<T>>>(
    options: {
      onSet?: R["set"];
      onGet?: R["get"];
    } = {}
  ) => {
    const set = jest.fn<ReturnType<R["set"]>, Parameters<R["set"]>>(
      (target, key, value, isInternal) => {
        if (options.onSet) {
          return options.onSet(target, key, value as any, isInternal);
        }

        return true as any;
      }
    );

    const get = jest.fn<ReturnType<R["get"]>, Parameters<R["get"]>>(
      (target, key, suggestedValue, isInternal) => {
        if (options.onGet) {
          return options.onGet(target, key, suggestedValue as any, isInternal);
        }

        return suggestedValue as any;
      }
    );

    return { set, get };
  };

  it("assigments should be working just fine with empty options", () => {
    @interceptable()
    class A {
      public a: number = 123;
      public b: string = "bbb";
      public c: boolean;

      public constructor() {
        this.c = false;
      }

      public checkInternalReads() {
        expect(a.a).toBe(123);
        expect(a.b).toBe("BBB");
        expect(a.c).toBe(false);
      }
    }

    const a = new A();

    expect(a.a).toBe(123);
    expect(a.b).toBe("bbb");
    expect(a.c).toBe(false);

    a.b = a.b.toUpperCase();

    expect(a.b).toBe("BBB");

    a.checkInternalReads();
  });

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

  it("assigments inside class method should cause internal set events", () => {
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

  it("assigments inside async class method should cause internal set events", async () => {
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

  it("setting functions as class properties dynamically should be only allowed if `allowDynamicFunctionAssigments` has been provided, else raise error", () => {
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
