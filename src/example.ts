import { createScopedLogger, ILogger } from "./other/scoped-logger";
import { sleep } from "./timers";

export const main = async () => {
  const { injectScopedLoger } = createScopedLogger({
    transports: []
  });

  //   rootLogger.log(123);
  //   rootLogger.log(123, "aaa");
  //   rootLogger.warnLazy(() => ["I am lazy", "message", "..."]);

  @injectScopedLoger
  class B {
    private id = 6;
    private logger!: ILogger;

    async work() {
      this.logger.log("Starting B::work...");
      await sleep(100);
      this.logger.warnLazy(() => ["Finished B::work!"]);
    }
  }

  @injectScopedLoger
  class A {
    private id = 7;
    private logger!: ILogger;
    public b = new B();

    async work() {
      this.logger.log("Starting A::work...");
      await this.b.work();
      this.logger.log("FinishedA::work!");
    }
  }

  const a = new A();

  await a.work();
};

main().catch(console.error);
