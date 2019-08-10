/* istanbul ignore file */

import { Channel } from "@channel/channel";
import { chronologicallyChainChannels } from "../../channels";
import { SyncOrAsync } from "../../types";

export interface ISubscriptionInfo<CONTEXT> {
  rootValue: any;
  args: any;
  context: CONTEXT;
  info: any;
}

export type SubscriptionUpdateData<T> = T extends Array<infer U> ? U : T;

export abstract class SubscribtionWithInitDataService<INIT_DATA, CONTEXT extends {} = any> {
  public subscribe(
    _rootValue: any,
    _args: any,
    _context: any,
    _info: any
  ): Channel<INIT_DATA | SubscriptionUpdateData<INIT_DATA>> {
    const ctx: ISubscriptionInfo<CONTEXT> = {
      rootValue: _rootValue,
      args: _args,
      context: _context,
      info: _info
    };

    const getInitDataChannel = new Channel<INIT_DATA>(async (push, stop) => {
      const initInfo: INIT_DATA = await this.getInitData(ctx);

      await push(initInfo);

      stop();
    });

    const liveUpdatesChannel = this.getLiveUpdatesStream(ctx);

    return chronologicallyChainChannels<INIT_DATA | SubscriptionUpdateData<INIT_DATA>>([
      getInitDataChannel,
      liveUpdatesChannel
    ]);
  }

  protected abstract getInitData(ctx: ISubscriptionInfo<CONTEXT>): SyncOrAsync<INIT_DATA>;

  protected abstract getLiveUpdatesStream(
    ctx: ISubscriptionInfo<CONTEXT>
  ): Channel<SubscriptionUpdateData<INIT_DATA>>;
}
