/* istanbul ignore file */

import { GraphQLResolveInfo } from "graphql";
import { ArgsDictionary, ResolverData } from "type-graphql";
import {
  chronologicallyCombineAsyncIterators,
  createAsyncIteratorUtilChain
} from "../../iterators";

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
      createAsyncIteratorUtilChain(initDataAI).finish(),
      createAsyncIteratorUtilChain(liveUpdatesAI).finish()
    ]);
  }

  protected abstract getInitData(resolverData: ResolverData<CONTEXT>): AsyncIterator<INIT_DATA>;

  protected abstract getLiveUpdatesStream(
    resolverData: ResolverData<CONTEXT>
  ): AsyncIterator<SubscriptionUpdateData<INIT_DATA>>;
}
