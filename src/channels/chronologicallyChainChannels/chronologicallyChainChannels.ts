import { noop } from "@babel/types";
import { Channel } from "@channel/channel";
import { Deferred } from "ts-deferred";
import { isPromisePending } from "../../other";
import { InfiniteCapacityBuffer } from "../InfiniteCapacityBuffer";

const channelToInfiniteCapacityBufferChannel = <T>(channel: Channel<T>): Channel<T> => {
  return new Channel<T>(async (push, stop) => {
    try {
      for await (const val of channel) {
        await push(val);
      }
    } catch (ex) {
      stop(ex);
      return;
    }

    stop();
  }, new InfiniteCapacityBuffer());
};

const createSafeExecutaionContext = (fn: () => Promise<any>): void => {
  fn().catch(ex => {
    console.error(`Function passed to createSafeExecutaionContext threw and error:`, ex);
  });
};

export const chronologicallyChainChannels = <T>(channels: Channel<T>[]): Channel<T> => {
  const forwardingChannels: Channel<T>[] = channels.map(channelToInfiniteCapacityBufferChannel);

  return new Channel<T>(async (push, stop) => {
    const exceptionDefer = new Deferred<Error>();

    const doneDefers = new WeakMap<Channel<T>, Deferred<void>>();
    forwardingChannels.forEach(forwardingChannel =>
      doneDefers.set(forwardingChannel, new Deferred<void>())
    );

    const pushWithOrder = async (caller: Channel<T>, value: T): Promise<void> => {
      const previousCallerIndex = forwardingChannels.findIndex(item => item === caller) - 1;
      const previousCaller = forwardingChannels[previousCallerIndex] || null;
      const result = await Promise.race([
        exceptionDefer.promise,
        previousCaller ? doneDefers.get(previousCaller)!.promise : null
      ]);

      if (result instanceof Error) {
        throw new Error(`Bailing out...`);
      }

      await push(value);
    };

    const isEveyoneDone = async (): Promise<boolean> => {
      for (let forwardingChannel of forwardingChannels) {
        if (await isPromisePending(doneDefers.get(forwardingChannel)!.promise)) {
          return false;
        }
      }

      return true;
    };

    const takeException = async (caller: Channel<T>, ex: Error): Promise<void> => {
      if (!(await isPromisePending(exceptionDefer.promise))) {
        return;
      }

      exceptionDefer.resolve(ex);
      stop(ex);

      forwardingChannels.forEach(forwardingChannel => forwardingChannel.return());
    };

    const finish = async (caller: Channel<T>): Promise<void> => {
      doneDefers.get(caller)!.resolve();

      if (await isEveyoneDone()) {
        stop();
      }
    };

    for (const forwardingChannel of forwardingChannels) {
      createSafeExecutaionContext(async () => {
        try {
          for await (const value of forwardingChannel) {
            await pushWithOrder(forwardingChannel, value);
          }
        } catch (ex) {
          takeException(forwardingChannel, ex).catch(noop);
        }

        finish(forwardingChannel).catch(noop);
      });
    }
  });
};
