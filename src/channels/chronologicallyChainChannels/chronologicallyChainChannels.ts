import { Channel } from "@channel/channel";
import { InfiniteCapacityBuffer } from "../InfiniteCapacityBuffer";

const OVERRIDE_LAZY_INITIALIZATION = Symbol();

export const chronologicallyChainChannels = <T>(channels: Channel<T>[]): Channel<T> => {
  return new Channel<T>(async (push, stop) => {
    const forwardingChannels: Channel<T>[] = [];

    let exception: Error | null = null;

    for (const channel of channels) {
      const forwardingChannel = new Channel<T>(async (push, stop) => {
        try {
          for await (const val of channel) {
            // if other channel threw an error stop asap

            if ((val as any) === OVERRIDE_LAZY_INITIALIZATION) {
              continue;
            }

            if (exception) {
              await stop();
            }

            await push(val);
          }
        } catch (ex) {
          exception = exception || ex;
        } finally {
          await stop();
        }
      }, new InfiniteCapacityBuffer());

      forwardingChannels.push(forwardingChannel);
    }

    for (const forwardingChannel of forwardingChannels) {
      if (exception) {
        break;
      }

      for await (const value of forwardingChannel) {
        if (exception) {
          break;
        }

        await push(value);
      }
    }

    await stop(exception);
  });
};
