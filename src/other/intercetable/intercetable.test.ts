import { IIntercetableOptions, interceptable } from "./intercetable";
import { IntercetableContext, IntercetableContextType } from "./IntercetableContext";
import { sleep } from "../../timers";

/*
 *
 * @TODO:
 * - Add `Object.defineProperty(...)` tests.
 * - Add getter/setters tests.
 * - Add support for other "proxable" actions (on delete, initialize?).
 *
 */

describe("intercetable", () => {
  const createMocks = <T extends Object, R extends Required<IIntercetableOptions<T>>>(
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

  it("assigments inside class constructor should cause internal set events", () => {
    expect.assertions(4);

    const mocks = createMocks<A, Required<IIntercetableOptions<A>>>({});

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

        const type = IntercetableContext.getContextType(this);
        expect(type === IntercetableContextType.Internal || type === null).toBe(true);
      }
    }

    const a = new A();

    expect(mocks.set).toHaveBeenNthCalledWith(1, a, "a", 123, true);
    expect(mocks.set).toHaveBeenNthCalledWith(2, a, "b", "bbb", true);
    expect(mocks.set).toHaveBeenNthCalledWith(3, a, "c", false, true);
  });

  it("assigments outside class should cause external set events", () => {
    const mocks = createMocks<A, Required<IIntercetableOptions<A>>>({});

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

    const mocks = createMocks<A, Required<IIntercetableOptions<A>>>({});

    @interceptable(mocks)
    class A {
      public a?: number;
      public b?: string;

      public setValues(a: number, b: string): void {
        this.a = a;
        this.b = b;

        expect(IntercetableContext.getContextType(this)).toBe(IntercetableContextType.Internal);
      }
    }

    const a = new A();

    a.setValues(123, "bbb");

    expect(mocks.set).toHaveBeenNthCalledWith(1, a, "a", 123, true);
    expect(mocks.set).toHaveBeenNthCalledWith(2, a, "b", "bbb", true);
  });

  it("assigments inside async class method should cause internal set events", async () => {
    expect.assertions(4);

    const mocks = createMocks<A, Required<IIntercetableOptions<A>>>({});

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

        expect(IntercetableContext.getContextType(this)).toBe(IntercetableContextType.Internal);
      }
    }

    const a = new A();

    await expect(a.setValues(123, "bbb")).resolves.not.toThrow();

    expect(mocks.set).toHaveBeenNthCalledWith(1, a, "a", 123, true);
    expect(mocks.set).toHaveBeenNthCalledWith(2, a, "b", "bbb", true);
  });

  it("setting functions as class properties should cause an error", () => {
    const mocks = createMocks<ClassWithNormalFN, Required<IIntercetableOptions<ClassWithNormalFN>>>(
      {}
    );

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

  it.skip("assigments inside class property function should cause internal set events", () => {
    const mocks = createMocks<A, Required<IIntercetableOptions<A>>>({});

    @interceptable(mocks)
    class A {
      public a?: number;
      public b?: string;

      public setValuesNormal = function(a: number, b: string): void {
        // @ts-ignore
        const that = this;
        that.a = a;
        that.b = b;

        expect(IntercetableContext.getContextType(that)).toBe(IntercetableContextType.Internal);
      };

      public setValuesArrow = (a: number, b: string): void => {
        this.a = a;
        this.b = b;

        expect(IntercetableContext.getContextType(this)).toBe(null);
      };
    }

    const a = new A();

    expect(mocks.set).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      "setValuesNormal",
      expect.anything(), // bound normal function
      true
    );

    expect(mocks.set).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      "setValuesArrow",
      expect.anything(), // bound arrow function ???????
      true
    );

    a.setValuesNormal(666, "normal");
    expect(mocks.set).toHaveBeenNthCalledWith(3, expect.anything(), "a", 666, true);
    expect(mocks.set).toHaveBeenNthCalledWith(4, expect.anything(), "b", "normal", true);

    a.setValuesArrow(333, "arrow");
    expect(mocks.set).toHaveBeenNthCalledWith(5, expect.anything(), "a", 333, true);
    expect(mocks.set).toHaveBeenNthCalledWith(6, expect.anything(), "b", "arrow", true);
  });
});
