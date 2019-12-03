import { generateShortID } from "./generateShortID";

describe("generateShortID", () => {
  it("should generate short id", () => {
    expect(generateShortID().length).toBe(8);
  });
});
