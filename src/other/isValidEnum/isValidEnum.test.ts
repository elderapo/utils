import { isValidEnum } from "./isValidEnum";

describe("isValidEnum", () => {
  it("returns true for valid numeric enums", () => {
    enum SampleEnum {
      One,
      Two
    }

    expect(isValidEnum(SampleEnum, SampleEnum.One)).toBe(true);
    expect(isValidEnum(SampleEnum, SampleEnum.Two)).toBe(true);
  });

  it("returns true for valid string enums", () => {
    enum SampleEnum {
      One = "one",
      Two = "two"
    }

    expect(isValidEnum(SampleEnum, SampleEnum.One)).toBe(true);
    expect(isValidEnum(SampleEnum, SampleEnum.Two)).toBe(true);
  });

  it("returns false for invalid string enums", () => {
    enum SampleEnum {
      One = "one",
      Two = "two"
    }

    expect(isValidEnum(SampleEnum, "onee" as any)).toBe(false);
    expect(isValidEnum(SampleEnum, "twoo" as any)).toBe(false);
  });

  it("returns false for invalid numeric enums", () => {
    enum SampleEnum {
      One,
      Two
    }

    expect(isValidEnum(SampleEnum, 3)).toBe(false);
    expect(isValidEnum(SampleEnum, -1)).toBe(false);
  });
});
