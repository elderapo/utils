import { mutateReadonlyProperty } from "./mutateReadonlyProperty";

describe("mutateReadonlyProperty", () => {
  it("should be able to mutate readonly properties", () => {
    class Tmp {
      public readonly a: string = "aaa";
    }

    const tmp = new Tmp();
    mutateReadonlyProperty(tmp, "a", "bbb");

    expect(tmp).toMatchObject({ a: "bbb" });
  });

  it("should be able to mutate normal properties", () => {
    class Tmp {
      public readonly a: string = "aaa";
    }

    const tmp = new Tmp();
    mutateReadonlyProperty(tmp, "a", "bbb");

    expect(tmp).toMatchObject({ a: "bbb" });
  });
});
