import { Channel } from "@channel/channel";
import { sleep } from "../../timers";
import { chronologicallyChainChannels } from "../chronologicallyChainChannels";

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

  const createCallOrderCheckerHelper = () => {
    let i = 0;

    return () => {
      const callID = i++;

      console.log("CALL_ID:", callID);

      return callID;
    };
  };

  it("should work with non delayed pushes", async () => {
    const getCallIndex = createCallOrderCheckerHelper();

    const initChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(0);
      await push(1);
      expect(getCallIndex()).toBe(2);
      await stop();
      expect(getCallIndex()).toBe(4);
    });

    const liveUpdateChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(1);
      await push(2);
      expect(getCallIndex()).toBe(3);
      await push(3);
      expect(getCallIndex()).toBe(5);
      await push(4);
      expect(getCallIndex()).toBe(6);
      await push(5);
      expect(getCallIndex()).toBe(7);

      await stop();

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

  it("should work with delayed pushes", async () => {
    const getCallIndex = createCallOrderCheckerHelper();

    const initChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(0);
      await push(1);
      expect(getCallIndex()).toBe(2);
      await sleep(10);
      expect(getCallIndex()).toBe(4);
      await stop();
      expect(getCallIndex()).toBe(5);
    });

    const liveUpdateChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(1);
      await push(2);
      expect(getCallIndex()).toBe(3);
      await sleep(10);
      expect(getCallIndex()).toBe(6);
      await push(3);
      expect(getCallIndex()).toBe(7);
      await sleep(10);
      expect(getCallIndex()).toBe(8);
      await push(4);
      expect(getCallIndex()).toBe(9);
      await sleep(10);
      expect(getCallIndex()).toBe(10);
      await push(5);
      expect(getCallIndex()).toBe(11);
      await sleep(10);
      expect(getCallIndex()).toBe(12);

      await stop();
      expect(getCallIndex()).toBe(13);
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
      await sleep(100);
      expect(getCallIndex()).toBe(11);
      await push(1);
      expect(getCallIndex()).toBe(12);
      await stop();
      expect(getCallIndex()).toBe(13);
    });

    const liveUpdateChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(1);
      await push(2);
      expect(getCallIndex()).toBe(2);
      await sleep(10);
      expect(getCallIndex()).toBe(3);
      await push(3);
      expect(getCallIndex()).toBe(4);
      await sleep(10);
      expect(getCallIndex()).toBe(5);
      await push(4);
      expect(getCallIndex()).toBe(6);
      await sleep(10);
      expect(getCallIndex()).toBe(7);
      await push(5);
      expect(getCallIndex()).toBe(8);
      await sleep(10);
      expect(getCallIndex()).toBe(9);

      await stop();
      expect(getCallIndex()).toBe(10);
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
      await sleep(100);
      expect(getCallIndex()).toBe(9);
      await push(1);
      expect(getCallIndex()).toBe(10);
      await stop();
      expect(getCallIndex()).toBe(11);
    });

    const liveUpdateChannel1 = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(1);
      await push(2);
      expect(getCallIndex()).toBe(3);
      await push(3);
      expect(getCallIndex()).toBe(5);

      await stop();
      expect(getCallIndex()).toBe(7);
    });

    const liveUpdateChannel2 = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(2);
      await push(4);
      expect(getCallIndex()).toBe(4);
      await push(5);
      expect(getCallIndex()).toBe(6);

      await stop();
      expect(getCallIndex()).toBe(8);
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
      expect(getCallIndex()).toBe(9);
      await push(1);
      expect(getCallIndex()).toBe(10);
      await sleep(100);
      expect(getCallIndex()).toBe(11);
      await push(2);
      expect(getCallIndex()).toBe(12);
      await stop();
      expect(getCallIndex()).toBe(13);
    });

    const liveUpdateChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(1);
      await push(3);
      expect(getCallIndex()).toBe(2);
      await sleep(10);
      expect(getCallIndex()).toBe(3);
      await push(4);
      expect(getCallIndex()).toBe(4);
      await sleep(10);
      expect(getCallIndex()).toBe(5);
      await push(5);
      expect(getCallIndex()).toBe(6);
      await sleep(10);
      expect(getCallIndex()).toBe(7);

      await stop();
      expect(getCallIndex()).toBe(8);
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
      await sleep(100);
      expect(getCallIndex()).toBe(9);
      await push(1);
      expect(getCallIndex()).toBe(10);
      await sleep(100);
      expect(getCallIndex()).toBe(11);
      await push(2);
      expect(getCallIndex()).toBe(12);
      await stop();
      expect(getCallIndex()).toBe(13);
    });

    const liveUpdateChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(1);
      await push(3);
      expect(getCallIndex()).toBe(2);
      await sleep(10);
      expect(getCallIndex()).toBe(3);
      await push(4);
      expect(getCallIndex()).toBe(4);
      await sleep(10);
      expect(getCallIndex()).toBe(5);
      await push(5);
      expect(getCallIndex()).toBe(6);
      await sleep(10);
      expect(getCallIndex()).toBe(7);

      await stop();
      expect(getCallIndex()).toBe(8);
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
      await sleep(100);
      expect(getCallIndex()).toBe(3);
      await push(1);
      expect(getCallIndex()).toBe(4);
      throw new Error(`INIT_CHANNEL_ERROR`);
    });

    const liveUpdateChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(1);
      await push(3);
      expect(getCallIndex()).toBe(2);
      await sleep(100);
      expect(getCallIndex()).toBe(5);
      await push(4);
      expect(getCallIndex()).toBe(6);
      await sleep(100);
      expect(getCallIndex()).toBe(7);
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
      await sleep(300);
      expect(getCallIndex()).toBe(5);

      // await stop();
      expect(getCallIndex()).toBe(6);
    });

    const liveUpdateChannel = new Channel<number>(async (push, stop) => {
      expect(getCallIndex()).toBe(1);
      await sleep(10);
      expect(getCallIndex()).toBe(2);
      await push(3);
      expect(getCallIndex()).toBe(3);
      await sleep(100);
      expect(getCallIndex()).toBe(4);

      throw new Error(`LIVE_UPDATE_CHANNEL_ERROR`);
    });

    await expect(waitForAllValues([initChannel, liveUpdateChannel])).rejects.toThrowError(
      "LIVE_UPDATE_CHANNEL_ERROR"
    );
  });
});
