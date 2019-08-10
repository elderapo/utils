/* istanbul ignore file */

import { Subscription } from "type-graphql";
import { ReturnTypeFunc } from "type-graphql/dist/decorators/types";
import { SubscribtionWithInitDataService } from "./SubscribtionWithInitDataService";

export const SubscriptionWithInitData = <
  UPDATE_DATA,
  INIT_DATA extends UPDATE_DATA | UPDATE_DATA[]
>(
  returnTypeFunc: ReturnTypeFunc,
  getService: () => SubscribtionWithInitDataService<UPDATE_DATA, INIT_DATA>
) => {
  return Subscription(returnTypeFunc, {
    subscribe: (...args) => getService().subscribe(...args)
  });
};
