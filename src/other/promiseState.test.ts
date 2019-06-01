import { promiseState, PromiseState } from "./promiseState";

describe("promiseState", () => {
  it("should resolve pending state", async () => {
    // tslint:disable-next-line
    expect(promiseState(new Promise(() => {}))).resolves.toMatchObject({
      state: PromiseState.Pending
    });
  });

  it("should resolve resolved state", async () => {
    // tslint:disable-next-line
    expect(
      promiseState(
        new Promise(resolve => {
          resolve("SUCCESS");
        })
      )
    ).resolves.toMatchObject({
      state: PromiseState.Resolved,
      value: "SUCCESS"
    });
  });

  it("should resolve rejected state", async () => {
    // tslint:disable-next-line
    expect(
      promiseState(
        new Promise((resolve, reject) => {
          reject(new Error("REJECTED"));
        })
      )
    ).resolves.toMatchObject({
      state: PromiseState.Rejected,
      err: new Error("REJECTED")
    });
  });
});
