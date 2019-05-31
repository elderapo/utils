import { sleep } from "./sleep";

describe("sleep", () => {
  it("returns instance of Promise", () => {
    expect(sleep(100)).toBeInstanceOf(Promise);
  });

  it("waits for at least given amount of ms", async () => {
    const before = Date.now();

    await sleep(100);

    const after = Date.now();

    expect(after - before).toBeGreaterThanOrEqual(100);
  });

  it("works with negative time", async () => {
    expect(() => sleep(-1)).not.toThrowError();
  });

  it("works with naN", async () => {
    expect(() => sleep(NaN)).not.toThrowError();
  });
});
