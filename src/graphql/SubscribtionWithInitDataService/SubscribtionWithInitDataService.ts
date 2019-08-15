/* istanbul ignore file */

import { GraphQLResolveInfo } from "graphql";
import { ArgsDictionary, ResolverData } from "type-graphql";
import { chronologicallyCombineAsyncIterators } from "../../iterators";

export type SubscriptionUpdateData<T> = T extends Array<infer U> ? U : T;

export abstract class SubscribtionWithInitDataService<INIT_DATA, CONTEXT extends {} = any> {
  public subscribe(
    _root: any,
    _args: ArgsDictionary,
    _context: CONTEXT,
    _info: GraphQLResolveInfo
  ): AsyncIterableIterator<INIT_DATA | SubscriptionUpdateData<INIT_DATA>> {
    const resolverData: ResolverData<CONTEXT> = {
      root: _root,
      args: _args,
      context: _context,
      info: _info
    };

    const initDataAI = this.getInitData(resolverData);

    const liveUpdatesAI = this.getLiveUpdatesStream(resolverData);

    return chronologicallyCombineAsyncIterators<INIT_DATA | SubscriptionUpdateData<INIT_DATA>>([
      initDataAI,
      liveUpdatesAI
    ]);
  }

  protected abstract getInitData(
    resolverData: ResolverData<CONTEXT>
  ): AsyncIterableIterator<INIT_DATA>;

  protected abstract getLiveUpdatesStream(
    resolverData: ResolverData<CONTEXT>
  ): AsyncIterableIterator<SubscriptionUpdateData<INIT_DATA>>;
}
