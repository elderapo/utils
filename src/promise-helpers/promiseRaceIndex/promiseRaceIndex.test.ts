import { noop } from "../../other/noop";
import { waitImmediate } from "../../timers";
import { promiseRaceIndex } from "./promiseRaceIndex";

describe("promiseRaceIndex", () => {
  it("should resolve", async () => {
    await expect(
      promiseRaceIndex([
        new Promise<number>(resolve => resolve(1)),
        new Promise<string>(noop),
        new Promise<string>(noop)
      ])
    ).resolves.toMatchObject({
      wonIndex: 0,
      value: 1
    });
  });

  it("should return first resolved value", async () => {
    await expect(
      promiseRaceIndex([
        new Promise<number>(resolve => resolve(1)),
        new Promise<number>(resolve => resolve(2))
      ])
    ).resolves.toMatchObject({
      wonIndex: 0,
      value: 1
    });

    await expect(
      promiseRaceIndex([
        new Promise<number>(async resolve => {
          await waitImmediate();
          return resolve(1);
        }),
        new Promise<number>(resolve => resolve(2))
      ])
    ).resolves.toMatchObject({
      wonIndex: 1,
      value: 2
    });
  });

  it("should throw error", async () => {
    await expect(
      promiseRaceIndex([
        new Promise<number>((_, reject) => reject(new Error("ID_1"))),
        new Promise<string>(noop)
      ])
    ).rejects.toThrowError("ID_1");
  });

  it("should throw first error", async () => {
    await expect(
      promiseRaceIndex([
        new Promise<number>((_, reject) => reject(new Error("ID_1"))),
        new Promise<string>((_, reject) => reject(new Error("ID_2")))
      ])
    ).rejects.toThrowError("ID_1");

    await expect(
      promiseRaceIndex([
        new Promise<number>(async (_, reject) => {
          await waitImmediate();
          return reject(new Error("ID_1"));
        }),
        new Promise<string>((_, reject) => reject(new Error("ID_2")))
      ])
    ).rejects.toThrowError("ID_2");
  });
});
