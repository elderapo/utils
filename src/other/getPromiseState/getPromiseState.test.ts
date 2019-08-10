import {
  isPromisePending,
  isPromiseRejected,
  isPromiseResolved,
  getPromiseState
} from "./getPromiseState";
import { noop } from "../noop";
import { PromiseState } from "./PromiseState";

describe("getPromiseState", () => {
  const pending = new Promise(noop);
  const resolved = new Promise<string>(resolve => resolve("SUCCESS"));
  const rejected = new Promise((resolve, reject) => reject(new Error("REJECTED")));

  rejected.catch(noop);

  /* tslint:disable:no-floating-promises */

  it("should resolve pending state", async () => {
    expect(getPromiseState(pending)).resolves.toMatchObject({
      state: PromiseState.Pending
    });
  });

  it("should resolve resolved state", async () => {
    expect(getPromiseState(resolved)).resolves.toMatchObject({
      state: PromiseState.Resolved,
      value: "SUCCESS"
    });
  });

  it("should resolve rejected state", async () => {
    expect(getPromiseState(rejected)).resolves.toMatchObject({
      state: PromiseState.Rejected,
      err: new Error("REJECTED")
    });
  });

  it("isPending should work", async () => {
    expect(isPromisePending(pending)).resolves.toBe(true);
    expect(isPromisePending(resolved)).resolves.toBe(false);
    expect(isPromisePending(rejected)).resolves.toBe(false);
  });

  it("should resolve resolved state", async () => {
    expect(isPromiseResolved(pending)).resolves.toBe(false);
    expect(isPromiseResolved(resolved)).resolves.toBe(true);
    expect(isPromiseResolved(rejected)).resolves.toBe(false);
  });

  it("should resolve rejected state", async () => {
    expect(isPromiseRejected(pending)).resolves.toBe(false);
    expect(isPromiseRejected(resolved)).resolves.toBe(false);
    expect(isPromiseRejected(rejected)).resolves.toBe(true);
  });

  /* tslint:enable:no-floating-promises */
});
