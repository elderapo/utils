/* istanbul ignore file */

import { Subscription } from "type-graphql";
import { ReturnTypeFunc } from "type-graphql/dist/decorators/types";
import { SubscribtionWithInitDataService } from "./SubscribtionWithInitDataService";

export const SubscriptionWithInitData = <INIT_DATA, CONTEXT extends {} = any>(
  returnTypeFunc: ReturnTypeFunc,
  getService: () => SubscribtionWithInitDataService<INIT_DATA, CONTEXT>
) => {
  return Subscription(returnTypeFunc, {
    subscribe: (...args) => getService().subscribe(...args)
  });
};
