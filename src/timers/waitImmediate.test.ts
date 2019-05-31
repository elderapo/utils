import { waitImmediate } from "./waitImmediate";

describe("waitImmediate", () => {
  it("returns instance of Promise", () => {
    // tslint:disable-next-line
    expect(waitImmediate()).toBeInstanceOf(Promise);
  });

  it("returns almost immediate lol", async () => {
    const [beforeS, beforeNS] = process.hrtime();

    await waitImmediate();

    const [afterS, afterNS] = process.hrtime();

    expect(beforeNS).not.toBe(afterNS);
    expect(beforeS).toBe(afterS); // it's very unlikely that this will fail ?
  });
});
