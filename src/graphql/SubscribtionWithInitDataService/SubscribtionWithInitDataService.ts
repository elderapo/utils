/* istanbul ignore file */

import { Channel } from "@channel/channel";
import { GraphQLResolveInfo } from "graphql";
import { ArgsDictionary, ResolverData } from "type-graphql";
import { chronologicallyChainChannels } from "../../channels";
import { SyncOrAsync } from "../../types";

export type SubscriptionUpdateData<T> = T extends Array<infer U> ? U : T;

export abstract class SubscribtionWithInitDataService<INIT_DATA, CONTEXT extends {} = any> {
  public subscribe(
    _root: any,
    _args: ArgsDictionary,
    _context: CONTEXT,
    _info: GraphQLResolveInfo
  ): Channel<INIT_DATA | SubscriptionUpdateData<INIT_DATA>> {
    const resolverData: ResolverData<CONTEXT> = {
      root: _root,
      args: _args,
      context: _context,
      info: _info
    };

    const getInitDataChannel = new Channel<INIT_DATA>(async (push, stop) => {
      const initInfo: INIT_DATA = await this.getInitData(resolverData);

      await push(initInfo);

      stop();
    });

    const liveUpdatesChannel = this.getLiveUpdatesStream(resolverData);

    return chronologicallyChainChannels<INIT_DATA | SubscriptionUpdateData<INIT_DATA>>([
      getInitDataChannel,
      liveUpdatesChannel
    ]);
  }

  protected abstract getInitData(resolverData: ResolverData<CONTEXT>): SyncOrAsync<INIT_DATA>;

  protected abstract getLiveUpdatesStream(
    resolverData: ResolverData<CONTEXT>
  ): Channel<SubscriptionUpdateData<INIT_DATA>>;
}
