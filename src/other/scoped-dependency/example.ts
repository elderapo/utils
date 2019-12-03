import { generateShortID } from "../generateShortID";
import { attachDependency, listScopes, scoped } from "./scoped-dependency";
import { IScopeContext } from "./ScopedDependencyUtils";

const nextIds = new Map<string, number>();

const getNextId = (tag: string): number => {
  if (!nextIds.has(tag)) {
    nextIds.set(tag, 0);
  }

  const current = nextIds.get(tag)!;
  nextIds.set(tag, current + 1);

  return current;
};

@scoped()
class D {
  private id = getNextId("D");
}

@scoped()
class C {
  private id = getNextId("C");

  private d1!: D;
  private d2!: D;
  private d3!: D;

  private constructor() {}

  private async initialize(): Promise<void> {
    this.d1 = this.createScopedD();
    this.d2 = this.createScopedD();
    this.d3 = this.createScopedD();
  }

  private createScopedD(): D {
    const instance = new D();

    attachDependency(this, instance);

    return instance;
  }

  public static async create(): Promise<C> {
    const instance = new C();

    await instance.initialize();

    return instance;
  }
}

@scoped({ name: "BBB" })
class B {
  private id = getNextId("B");
  private c!: C;

  private constructor() {}

  public async initialize(): Promise<void> {
    this.c = await C.create();
    attachDependency(this, this.c);
  }

  public static async create(): Promise<B> {
    const instance = new B();

    await instance.initialize();

    return instance;
  }
}

@scoped()
class A {
  private b1!: B;
  private b2!: B;

  private constructor() {}

  private async initialize(): Promise<void> {
    this.b1 = await this.createScopedB();
    this.b2 = await this.createScopedB();
  }

  private async createScopedB(): Promise<B> {
    const instance = await B.create();

    attachDependency(this, instance);

    return instance;
  }

  public static async create(): Promise<A> {
    const instance = new A();

    await instance.initialize();

    return instance;
  }
}

const main = async () => {
  const a = await A.create();

  const scopesToString = (scopes: IScopeContext[]): string => {
    return scopes
      .map(scope => (scope.id !== null ? `${scope.name}<${scope.id}>` : scope.name))
      .join(" > ");
  };

  console.log(scopesToString(listScopes(a)));

  console.log("\n");

  console.log(scopesToString(listScopes(a["b1"])));
  console.log(scopesToString(listScopes(a["b2"])));

  console.log("\n");

  console.log(scopesToString(listScopes(a["b1"]["c"])));
  console.log(scopesToString(listScopes(a["b2"]["c"])));

  console.log("\n");

  console.log(scopesToString(listScopes(a["b1"]["c"]["d1"])));
  console.log(scopesToString(listScopes(a["b1"]["c"]["d2"])));
  console.log(scopesToString(listScopes(a["b1"]["c"]["d3"])));

  console.log("\n");

  console.log(scopesToString(listScopes(a["b2"]["c"]["d1"])));
  console.log(scopesToString(listScopes(a["b2"]["c"]["d2"])));
  console.log(scopesToString(listScopes(a["b2"]["c"]["d3"])));
};

main().catch(console.error);
