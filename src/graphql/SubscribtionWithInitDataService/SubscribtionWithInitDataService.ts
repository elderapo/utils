/* istanbul ignore file */

import { Channel } from "@channel/channel";
import { chronologicallyChainChannels } from "../../channels";
import { SyncOrAsync } from "../../types";

export interface ISubscriptionContext {
  rootValue: any;
  args: any;
  context: any;
  info: any;
}

export abstract class SubscribtionWithInitDataService<
  UPDATE_DATA,
  INIT_DATA extends UPDATE_DATA | UPDATE_DATA[]
> {
  public subscribe(
    _rootValue: any,
    _args: any,
    _context: any,
    _info: any
  ): Channel<INIT_DATA | UPDATE_DATA> {
    const ctx: ISubscriptionContext = {
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

    return chronologicallyChainChannels<INIT_DATA | UPDATE_DATA>([
      getInitDataChannel,
      liveUpdatesChannel
    ]);
  }

  protected abstract getInitData(ctx: ISubscriptionContext): SyncOrAsync<INIT_DATA>;

  protected abstract getLiveUpdatesStream(ctx: ISubscriptionContext): Channel<UPDATE_DATA>;
}
