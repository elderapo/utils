import {
  ConsoleLoggerTransport,
  createScopedLogger,
  generateShortID,
  ILogger,
  setNamespaceName,
  FileLoggerTransport
} from "..";
import { sleep } from "../../timers";
import * as path from "path";

export const main = async () => {
  const { injectScopedLoger } = createScopedLogger({
    transports: [
      new ConsoleLoggerTransport(),
      new FileLoggerTransport({
        directory: path.join(__dirname, "..", "logs"),
        deleteFilesOlderThan: 1000 * 60
      })
    ]
  });

  const nonSerializable = {
    a: {
      b: "bbb"
    }
  };

  (nonSerializable as any)["a"]["c"] = nonSerializable;

  @injectScopedLoger
  class TaskC {
    private id = generateShortID();
    private logger!: ILogger;

    async work() {
      this.logger.log("Starting C::work...", { hehehe: "heuheuehue", numb: 666 });
      this.logger.info("Finished C::work!", { s: Symbol("ajjaja"), nonSerializable });
    }
  }

  @setNamespaceName("FFF")
  @injectScopedLoger
  class TaskB {
    static a = 123;

    private id = generateShortID();
    private logger!: ILogger;

    private c1 = new TaskC();
    private c2 = new TaskC();
    private c3 = new TaskC();
    private c4 = new TaskC();

    async work() {
      this.logger.error("Wyjebało błont", new TypeError("zjebalo sie i nie dziala!!!1"));
      await this.c1.work();
      await this.c2.work();
      await this.c3.work();
      await this.c4.work();
      this.logger.logLazy(() => [
        "Finished B::work!",
        {
          a: {
            b1: { c: "ccc" },
            b2: "b2222",
            b3: false,
            b4: {
              a: {
                b1: { c: "ccc" },
                b2: "b2222",
                b3: {
                  a: {
                    b1: { c: "ccc" },
                    b2: { a: { b1: { c: "ccc" }, b2: "b2222", b3: false, b4: Symbol() } },
                    b3: false,
                    b4: Symbol()
                  }
                },
                b4: Symbol()
              }
            }
          }
        }
      ]);
    }
  }

  @injectScopedLoger
  class TaskA {
    private id = generateShortID();
    private logger!: ILogger;
    public b = new TaskB();

    async work() {
      this.logger.log("Starting A::work...");
      await this.b.work();
      this.logger.warn("FinishedA::work!");
    }
  }

  while (true) {
    await new TaskA().work();

    await new TaskB().work();

    await new TaskC().work();

    await sleep(100);
  }
};

main().catch(console.error);
