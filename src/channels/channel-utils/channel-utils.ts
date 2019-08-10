import { noop } from "@babel/types";
import { Channel } from "@channel/channel";
import { prepareAsyncIteratorForIteration } from "../../iterators";
import { SyncOrAsync } from "../../types";

export const filterChannel = <T>(
  channel: Channel<T>,
  filterFN: (item: T) => SyncOrAsync<boolean>
): Channel<T> => {
  return new Channel<T>(async (push, stop) => {
    const promises: Promise<any>[] = [];

    for await (const item of channel) {
      // so we don't miss events comming form async iterators
      const promise = Promise.resolve(filterFN(item));

      promise
        .then(ok => {
          if (ok) {
            push(item).catch(noop);
          }
        })
        .catch(stop);

      promises.push(promise);
    }

    await Promise.all(promises);

    stop();
  });
};

export const mapChannel = <FROM, TO>(
  channel: Channel<FROM>,
  mapFN: (item: FROM) => SyncOrAsync<TO>
): Channel<TO> => {
  return new Channel<TO>(async (push, stop) => {
    const promises: Promise<any>[] = [];

    for await (const item of channel) {
      // so we don't miss events comming form async iterators
      const promise = Promise.resolve(mapFN(item));

      promise.then(mapped => push(mapped)).catch(stop);

      promises.push(promise);
    }

    await Promise.all(promises);

    stop();
  });
};

/* istanbul ignore next */
export const createChannelFromAsyncIterator = <T>(asyncIterator: AsyncIterator<T>): Channel<T> => {
  const channel = new Channel<T>(async (push, stop) => {
    for await (const item of prepareAsyncIteratorForIteration(asyncIterator)) {
      // so we don't miss events comming form async iterators
      push(item).catch(noop);
    }
    stop();
  });

  return channel;
};
