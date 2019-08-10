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

  it("should work with non delayed pushes", async () => {
    const initChannel = new Channel<number>(async (push, stop) => {
      await push(1);
      await stop();
    });

    const liveUpdateChannel = new Channel<number>(async (push, stop) => {
      await push(2);
      await push(3);
      await push(4);
      await push(5);

      await stop();
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
    const initChannel = new Channel<number>(async (push, stop) => {
      await push(1);
      await sleep(10);
      await stop();
    });

    const liveUpdateChannel = new Channel<number>(async (push, stop) => {
      await push(2);
      await sleep(10);
      await push(3);
      await sleep(10);
      await push(4);
      await sleep(10);
      await push(5);
      await sleep(10);

      await stop();
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
    const initChannel = new Channel<number>(async (push, stop) => {
      await sleep(100);
      await push(1);
      await stop();
    });

    const liveUpdateChannel = new Channel<number>(async (push, stop) => {
      await push(2);
      await sleep(10);
      await push(3);
      await sleep(10);
      await push(4);
      await sleep(10);
      await push(5);
      await sleep(10);

      await stop();
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
    const initChannel = new Channel<number>(async (push, stop) => {
      await sleep(100);
      await push(1);
      await stop();
    });

    const liveUpdateChannel1 = new Channel<number>(async (push, stop) => {
      await push(2);
      await push(3);

      await stop();
    });

    const liveUpdateChannel2 = new Channel<number>(async (push, stop) => {
      await push(4);
      await push(5);

      await stop();
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
    const initChannel = new Channel<number>(async (push, stop) => {
      await sleep(100);
      await push(1);
      await sleep(100);
      await push(2);
      await stop();
    });

    const liveUpdateChannel = new Channel<number>(async (push, stop) => {
      await push(3);
      await sleep(10);
      await push(4);
      await sleep(10);
      await push(5);
      await sleep(10);

      await stop();
    });

    await expect(waitForAllValues([initChannel, liveUpdateChannel], 1)).resolves
      .toMatchInlineSnapshot(`
      Array [
        1,
      ]
    `);
  });

  it("should correctly break on liveUpdate", async () => {
    const initChannel = new Channel<number>(async (push, stop) => {
      await sleep(100);
      await push(1);
      await sleep(100);
      await push(2);
      await stop();
    });

    const liveUpdateChannel = new Channel<number>(async (push, stop) => {
      await push(3);
      await sleep(10);
      await push(4);
      await sleep(10);
      await push(5);
      await sleep(10);

      await stop();
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
    const initChannel = new Channel<number>(async (push, stop) => {
      await sleep(100);
      await push(1);
      throw new Error(`INIT_CHANNEL_ERROR`);
    });

    const liveUpdateChannel = new Channel<number>(async (push, stop) => {
      await push(3);
      await sleep(100);
      await push(4);
      await sleep(100);
      throw new Error(`LIVE_UPDATE_CHANNEL_ERROR`);
    });

    await expect(waitForAllValues([initChannel, liveUpdateChannel])).rejects.toThrowError(
      "INIT_CHANNEL_ERROR"
    );
  });

  // it("should correctly handle exceptions in liveUpdateChannel", async () => {
  //   // setInterval(() => {
  //   //   console.log("ping");
  //   // }, 100);

  //   const initChannel = new Channel<number>(async (push, stop) => {
  //     await sleep(300);
  //     // await push(1);
  //     // throw new Error(`INIT_CHANNEL_ERROR`);
  //   });

  //   const liveUpdateChannel = new Channel<number>(async (push, stop) => {
  //     await push(3);
  //     await sleep(100);
  //     throw new Error(`LIVE_UPDATE_CHANNEL_ERROR`);
  //   });

  //   await expect(waitForAllValues([initChannel, liveUpdateChannel])).rejects.toThrowError(
  //     "LIVE_UPDATE_CHANNEL_ERROR"
  //   );
  // });
});
