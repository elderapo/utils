import * as Emittery from "emittery";

type Values<X> = X[keyof X];

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

export const eventEmitterRace = async <
  EVENTS extends {},
  REGISTERED_EVENT_IDS extends ReadonlyArray<keyof EVENTS>
>(
  eventEmitter: Emittery.Typed<EVENTS>,
  registeredEvents: REGISTERED_EVENT_IDS
): Promise<EventRaceResult<EVENTS, REGISTERED_EVENT_IDS>> => {
  return new Promise<EventRaceResult<EVENTS, REGISTERED_EVENT_IDS>>((resolve, reject) => {
    const unsubcribeFNs: Emittery.UnsubscribeFn[] = [];

    const cleanup = () => unsubcribeFNs.forEach(clean => clean());

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
};
