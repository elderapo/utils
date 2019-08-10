import { noop } from "@babel/types";
import { Channel } from "@channel/channel";
import { filterChannel, mapChannel } from "./channel-utils";
import { fixAsyncIteratorSymbol } from "../../test-utils";

describe("channel-utils", () => {
  beforeAll(() => {
    fixAsyncIteratorSymbol();
  });

  const waitForAllValues = async <T>(channel: Channel<T>): Promise<T[]> => {
    const values: T[] = [];

    for await (const value of channel) {
      values.push(value);
    }

    return values;
  };

  describe("filterChannel", () => {
    it("should work", async () => {
      const channel = new Channel<number>(async (push, stop) => {
        for (let i = 0; i < 10; i++) {
          push(i).catch(noop);
        }

        stop();
      });

      const filtered = filterChannel(channel, item => item % 2 === 0);

      await expect(waitForAllValues(filtered)).resolves.toMatchInlineSnapshot(`
                            Array [
                              0,
                              2,
                              4,
                              6,
                              8,
                            ]
                        `);
    });
  });

  describe("mapChannel", () => {
    it("should work", async () => {
      const channel = new Channel<number>(async (push, stop) => {
        for (let i = 0; i < 5; i++) {
          push(i).catch(noop);
        }

        stop();
      });

      const filtered = mapChannel(channel, item => `${item}-aaa`);

      await expect(waitForAllValues(filtered)).resolves.toMatchInlineSnapshot(`
              Array [
                "0-aaa",
                "1-aaa",
                "2-aaa",
                "3-aaa",
                "4-aaa",
              ]
            `);
    });
  });
});
