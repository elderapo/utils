import { isPromisePending } from "../getPromiseState";
import { createTimeoutHelper } from "./promiseTimeoutHelper";

describe("createTimeoutHelper", () => {
  it("should time out", async () => {
    const timeoutHelper = createTimeoutHelper({ timeout: 100 });

    let before = Date.now();
    await expect(timeoutHelper.timeoutPromise).rejects.toThrowError("Timed out after: 100ms!");
    expect(Date.now() - before).toBeGreaterThanOrEqual(100);
  });

  it("should not time out if cancelled", async () => {
    const timeoutHelper = createTimeoutHelper({ timeout: 100 });
    timeoutHelper.cancelTimeout();

    await expect(isPromisePending(timeoutHelper.timeoutPromise)).resolves.toBe(true);
  });
});
