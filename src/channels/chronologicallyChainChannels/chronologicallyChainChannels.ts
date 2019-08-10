import { Channel } from "@channel/channel";
import { InfiniteCapacityBuffer } from "../InfiniteCapacityBuffer";
import { sleep, waitImmediate } from "../../timers";

const BAIL_OUT = Symbol();

const channelToInfiniteCapacityBufferChannel = <T>(channel: Channel<T>): Channel<T> => {
  return new Channel<T>(async (push, stop) => {
    try {
      for await (const val of channel) {
        await push(val);
      }
    } catch (ex) {
      await stop(ex);
      return;
    }

    await stop();
  }, new InfiniteCapacityBuffer());
};

export const chronologicallyChainChannels = <T>(channels: Channel<T>[]): Channel<T> => {
  const forwardingChannels: Channel<T>[] = channels.map(channelToInfiniteCapacityBufferChannel);

  return new Channel<T>(async (push, stop) => {
    let exception: Error | null = null;

    const doneMap = new WeakMap<Channel<T>, boolean>();

    const promises: Promise<any>[] = [];

    const isPreviousDone = (channel: Channel<T>): boolean => {
      const previousIndex = forwardingChannels.indexOf(channel) - 1;

      if (previousIndex < 0) {
        return true;
      }

      const previous = forwardingChannels[previousIndex];

      return previous ? doneMap.get(previous)! : true;
    };

    const onException = (ex: Error): void => {
      console.log("SEtting ex", ex);
      exception = exception || ex;

      // forwardingChannels.forEach(forwardingChannel => forwardingChannel.return());
      // forwardingChannels.forEach(forwardingChannel => {
      //   console.log("NO KURWA...");
      //   forwardingChannel.next(BAIL_OUT);
      //   doneMap.set(forwardingChannel, true);
      // });
    };

    for (const forwardingChannel of forwardingChannels) {
      /* tslint:disable */

      const p = (async (forwardingChannel, exception) => {
        try {
          for await (const value of forwardingChannel) {
            while (!isPreviousDone(forwardingChannel)) {
              if (exception) {
                break;
              }

              await waitImmediate();
            }

            if ((value as any) === BAIL_OUT) {
              break;
            }

            if (exception) {
              break;
            }

            push(value);
          }
        } catch (ex) {
          onException(ex);
        }

        console.log("SETTING IS DONE!");
        doneMap.set(forwardingChannel, true);
      })(forwardingChannel, exception);

      promises.push(p);
    }

    await Promise.all(promises);

    await stop(exception);
  });
};
