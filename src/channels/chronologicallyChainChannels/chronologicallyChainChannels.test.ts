import { Channel } from "@channel/channel";
import { sleep } from "../../timers";
import { chronologicallyChainChannels } from "./chronologicallyChainChannels";
import { createCallOrderCheckerHelper } from "../../test-utils";

describe("chronologicallyChainChannels", () => {
  const waitForAllValues = async <T extends {}>(
    channels: Channel<T>[],
    exitLoopOn?: T
  ): Promise<T[]> => {
    let values: T[] = [];

    for await (let item of chronologicallyChainChannels(channels)) {
      values.push(item);

      if (exitLoopOn === item) {
        break;
      }
    }

    return values;
  };

  it("should work with non delayed pushes", async () => {
    expect.assertions(3);
    const getCallIndex = createCallOrderCheckerHelper();

    const initChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(0);

      await push(1);

      stop();
    });

    const liveUpdateChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(1);

      await push(2);
      await push(3);
      await push(4);
      await push(5);

      stop();
    });

    await expect(waitForAllValues([initChannel, liveUpdateChannel])).resolves
      .toMatchInlineSnapshot(`
      Array [
        1,
        2,
        3,
        4,
        5,
      ]
    `);
  });

  it("should work with delayed pushes", async () => {
    const getCallIndex = createCallOrderCheckerHelper();

    const initChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(0);

      await sleep(10);
      await push(1);

      expect(getCallIndex()).toBe(2);

      stop();
      expect(getCallIndex()).toBe(3);
    });

    const liveUpdateChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(1);

      await sleep(50);
      await push(2);

      expect(getCallIndex()).toBe(4);

      await sleep(50);
      await push(3);

      expect(getCallIndex()).toBe(5);

      await sleep(50);
      await push(4);

      expect(getCallIndex()).toBe(6);

      await sleep(50);
      await push(5);

      expect(getCallIndex()).toBe(7);

      stop();
      expect(getCallIndex()).toBe(8);
    });

    await expect(waitForAllValues([initChannel, liveUpdateChannel])).resolves
      .toMatchInlineSnapshot(`
      Array [
        1,
        2,
        3,
        4,
        5,
      ]
    `);
  });

  it("should work if db init query is slow", async () => {
    const getCallIndex = createCallOrderCheckerHelper();

    const initChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(0);

      await sleep(50);
      await push(1);

      expect(getCallIndex()).toBe(3);

      stop();
      expect(getCallIndex()).toBe(4);
    });

    const liveUpdateChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(1);

      await sleep(40);
      await push(2);

      expect(getCallIndex()).toBe(2);

      await sleep(40);
      await push(3);

      expect(getCallIndex()).toBe(5);

      await sleep(20);
      await push(4);

      expect(getCallIndex()).toBe(6);

      await sleep(20);
      await push(5);

      expect(getCallIndex()).toBe(7);

      stop();
      expect(getCallIndex()).toBe(8);
    });

    await expect(waitForAllValues([initChannel, liveUpdateChannel])).resolves
      .toMatchInlineSnapshot(`
      Array [
        1,
        2,
        3,
        4,
        5,
      ]
    `);
  });

  it("should work with more live updates", async () => {
    const getCallIndex = createCallOrderCheckerHelper();

    const initChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(0);

      await sleep(700);
      await push(1);

      expect(getCallIndex()).toBe(9);

      stop();
      expect(getCallIndex()).toBe(10);
    });

    const liveUpdateChannel1 = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(1);

      await sleep(100);
      await push(2);

      expect(getCallIndex()).toBe(6);

      await sleep(100);
      await push(3);

      expect(getCallIndex()).toBe(7);

      stop();
      expect(getCallIndex()).toBe(8);
    });

    const liveUpdateChannel2 = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(2);

      await push(4);
      await sleep(20);

      expect(getCallIndex()).toBe(3);

      await push(5);
      await sleep(20);

      expect(getCallIndex()).toBe(4);

      stop();
      expect(getCallIndex()).toBe(5);
    });

    await expect(waitForAllValues([initChannel, liveUpdateChannel1, liveUpdateChannel2])).resolves
      .toMatchInlineSnapshot(`
      Array [
        1,
        2,
        3,
        4,
        5,
      ]
    `);
  });

  it("should correctly break on initChannel", async () => {
    const getCallIndex = createCallOrderCheckerHelper();

    const initChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(0);

      await sleep(100);
      await push(1);

      expect(getCallIndex()).toBe(6);

      await sleep(100);
      await push(2);

      expect(getCallIndex()).toBe(7);

      stop();
      expect(getCallIndex()).toBe(8);
    });

    const liveUpdateChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(1);

      await push(3);
      await sleep(10);

      expect(getCallIndex()).toBe(2);

      await push(4);
      await sleep(10);

      expect(getCallIndex()).toBe(3);

      await push(5);
      await sleep(10);

      expect(getCallIndex()).toBe(4);

      stop();
      expect(getCallIndex()).toBe(5);
    });

    await expect(waitForAllValues([initChannel, liveUpdateChannel], 1)).resolves
      .toMatchInlineSnapshot(`
      Array [
        1,
      ]
    `);
  });

  it("should correctly break on liveUpdate", async () => {
    const getCallIndex = createCallOrderCheckerHelper();

    const initChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(0);

      await sleep(1);
      await push(1);

      expect(getCallIndex()).toBe(2);

      await sleep(100);
      await push(2);

      stop();
      expect(getCallIndex()).toBe(7);
    });

    const liveUpdateChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(1);

      await push(3);
      await sleep(10);

      expect(getCallIndex()).toBe(3);

      await push(4);
      await sleep(10);

      expect(getCallIndex()).toBe(4);

      await push(5);
      await sleep(10);

      expect(getCallIndex()).toBe(5);

      stop();
      expect(getCallIndex()).toBe(6);
    });

    await expect(waitForAllValues([initChannel, liveUpdateChannel], 4)).resolves
      .toMatchInlineSnapshot(`
      Array [
        1,
        2,
        3,
        4,
      ]
    `);
  });

  it("should correctly handle exceptions in initChannel", async () => {
    const getCallIndex = createCallOrderCheckerHelper();

    const initChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(0);

      await sleep(50);
      await push(1);

      expect(getCallIndex()).toBe(2);

      throw new Error(`INIT_CHANNEL_ERROR`);
    });

    const liveUpdateChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(1);

      await push(3);
      await sleep(100);

      expect(getCallIndex()).toBe(3);

      await push(4);
      await sleep(100);

      expect(getCallIndex()).toBe(4);

      throw new Error(`LIVE_UPDATE_CHANNEL_ERROR`);
    });

    await expect(waitForAllValues([initChannel, liveUpdateChannel])).rejects.toThrowError(
      "INIT_CHANNEL_ERROR"
    );
  });

  it("should correctly handle exceptions in liveUpdateChannel", async () => {
    const getCallIndex = createCallOrderCheckerHelper();

    const initChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(0);

      await sleep(10);
      await push(1);

      expect(getCallIndex()).toBe(2);

      await sleep(10);
      await push(2);

      expect(getCallIndex()).toBe(3);

      stop();
      expect(getCallIndex()).toBe(4);
    });

    const liveUpdateChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(1);

      await sleep(50);
      await push(3);

      expect(getCallIndex()).toBe(5);

      await sleep(100);

      expect(getCallIndex()).toBe(6);

      throw new Error(`LIVE_UPDATE_CHANNEL_ERROR`);
    });

    await expect(waitForAllValues([initChannel, liveUpdateChannel])).rejects.toThrowError(
      "LIVE_UPDATE_CHANNEL_ERROR"
    );
  });
});
