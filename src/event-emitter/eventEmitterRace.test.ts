import * as Emittery from "emittery";
import { eventEmitterRace } from "./eventEmitterRace";

describe("eventEmitterRace", () => {
  enum MyEvent {
    One = "one",
    Two = "two",
    Three = "three"
  }

  type MyEvents = {
    [MyEvent.One]: { aaa: string };
    [MyEvent.Two]: { bbb: number };
    [MyEvent.Three]: { ccc: boolean };
  };

  it("should work", async () => {
    const ee = new Emittery.Typed<MyEvents>();

    setImmediate(() => {
      void ee.emit(MyEvent.Two, {
        bbb: 123
      });
    });

    await expect(eventEmitterRace(ee, [MyEvent.One, MyEvent.Two] as const)).resolves.toMatchObject({
      event: MyEvent.Two,
      data: { bbb: 123 }
    });
  });
});
