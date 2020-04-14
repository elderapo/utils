import * as Emittery from "emittery";
import { createCancelablePromise, CancelablePromise } from "../promise-helpers";

type Values<X> = X[keyof X];

export type EmitterWithOn<T extends {}> = Extract<Emittery.Typed<T>, { on: any }>;

export type EventRaceResult<
  EVENTS extends {},
  REGISTERED_EVENT_IDS extends ReadonlyArray<keyof EVENTS>
> = Extract<
  Values<
    {
      [K in keyof EVENTS]: {
        event: K;
        data: EVENTS[K];
      };
    }
  >,
  { event: REGISTERED_EVENT_IDS[number] }
>;

export const eventEmitterRace = <
  EVENTS extends {},
  REGISTERED_EVENT_IDS extends ReadonlyArray<keyof EVENTS>
>(
  eventEmitter: EmitterWithOn<EVENTS>,
  registeredEvents: REGISTERED_EVENT_IDS
): CancelablePromise<EventRaceResult<EVENTS, REGISTERED_EVENT_IDS>> => {
  const unsubcribeFNs: Emittery.UnsubscribeFn[] = [];
  const cleanup = () => unsubcribeFNs.forEach(clean => clean());

  const promise = new Promise<EventRaceResult<EVENTS, REGISTERED_EVENT_IDS>>((resolve, reject) => {
    for (const event of registeredEvents) {
      unsubcribeFNs.push(
        eventEmitter.on(event as any, data => {
          cleanup();

          return resolve({
            event,
            data
          } as EventRaceResult<EVENTS, REGISTERED_EVENT_IDS>);
        })
      );
    }
  });

  return createCancelablePromise(promise, cleanup);
};
