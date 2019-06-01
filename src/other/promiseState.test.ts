import { isPending, isRejected, isResolved, promiseState, PromiseState } from "./promiseState";
import { noop } from "./noop";

describe("promiseState", () => {
  const pending = new Promise(noop);
  const resolved = new Promise<string>(resolve => resolve("SUCCESS"));
  const rejected = new Promise((resolve, reject) => reject(new Error("REJECTED")));

  rejected.catch(noop);

  /* tslint:disable:no-floating-promises */

  it("should resolve pending state", async () => {
    expect(promiseState(pending)).resolves.toMatchObject({
      state: PromiseState.Pending
    });
  });

  it("should resolve resolved state", async () => {
    expect(promiseState(resolved)).resolves.toMatchObject({
      state: PromiseState.Resolved,
      value: "SUCCESS"
    });
  });

  it("should resolve rejected state", async () => {
    expect(promiseState(rejected)).resolves.toMatchObject({
      state: PromiseState.Rejected,
      err: new Error("REJECTED")
    });
  });

  it("isPending should work", async () => {
    expect(isPending(pending)).resolves.toBe(true);
    expect(isPending(resolved)).resolves.toBe(false);
    expect(isPending(rejected)).resolves.toBe(false);
  });

  it("should resolve resolved state", async () => {
    expect(isResolved(pending)).resolves.toBe(false);
    expect(isResolved(resolved)).resolves.toBe(true);
    expect(isResolved(rejected)).resolves.toBe(false);
  });

  it("should resolve rejected state", async () => {
    expect(isRejected(pending)).resolves.toBe(false);
    expect(isRejected(resolved)).resolves.toBe(false);
    expect(isRejected(rejected)).resolves.toBe(true);
  });

  /* tslint:enable:no-floating-promises */
});
