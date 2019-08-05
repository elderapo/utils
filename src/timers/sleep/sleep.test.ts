import { sleep } from "./sleep";

describe("sleep", () => {
  it("returns instance of Promise", () => {
    // tslint:disable-next-line
    expect(sleep(100)).toBeInstanceOf(Promise);
  });

  it("waits for at least given amount of ms", async () => {
    const before = Date.now();

    await sleep(100);

    const after = Date.now();

    expect(after - before).toBeGreaterThanOrEqual(98); // it seems to sometimes finish little bit faster
  });

  it("works with negative time", async () => {
    expect(() => sleep(-1)).not.toThrowError();
  });

  it("works with naN", async () => {
    expect(() => sleep(NaN)).not.toThrowError();
  });
});
