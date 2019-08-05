import { capitalizeFirstLetter } from "./capitalizeFirstLetter";

describe("capitalizeFirstLetter", () => {
  it("should work with lower case letters", async () => {
    expect(capitalizeFirstLetter("abc")).toEqual("Abc");
  });

  it("should work with upper case letters", async () => {
    expect(capitalizeFirstLetter("Abc")).toEqual("Abc");
  });

  it("should work with numbers case letters", async () => {
    expect(capitalizeFirstLetter("123")).toEqual("123");
  });

  it("should work with empty strings", async () => {
    expect(capitalizeFirstLetter("")).toEqual("");
  });
});
