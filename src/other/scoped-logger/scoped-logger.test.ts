import { createScopedLogger } from "./logger";
import { TestingLoggerTransport, ILoggetTransportHandleItemOptions } from "./transports";
import { ILogger } from "./types";
import { LogLevel } from "./LogLevel";
import { setNamespaceName } from "../dependency-path";

describe("scoped-logger", () => {
  it("simple", () => {
    const handleItem = jest.fn<void, [ILoggetTransportHandleItemOptions]>();

    const { injectScopedLoger } = createScopedLogger({
      transports: [
        new TestingLoggerTransport({
          handleItem
        })
      ]
    });

    @injectScopedLoger
    class SampleClass {
      protected logger!: ILogger;

      public say(message: string) {
        this.logger.log(`I am saying: ${message}...`);
      }
    }

    const instance = new SampleClass();

    instance.say("hello");
    instance.say("world");

    expect(handleItem).toHaveBeenNthCalledWith(1, {
      args: ["I am saying: hello..."],
      level: LogLevel.Log,
      namespaces: [{ id: null, namespace: "SampleClass" }]
    });
    expect(handleItem).toHaveBeenNthCalledWith(2, {
      args: ["I am saying: world..."],
      level: LogLevel.Log,
      namespaces: [{ id: null, namespace: "SampleClass" }]
    });
  });

  it("should work with dependency path", () => {
    const handleItem = jest.fn<void, [ILoggetTransportHandleItemOptions]>();

    const { injectScopedLoger } = createScopedLogger({
      transports: [
        new TestingLoggerTransport({
          handleItem
        })
      ]
    });

    let nextTalkerID = 0;

    @injectScopedLoger
    class Talker {
      private id = nextTalkerID++;
      protected logger!: ILogger;

      public say(message: string) {
        this.logger.warn(`I am saying: ${message}...`);
      }
    }

    @injectScopedLoger
    class SampleClass {
      protected logger!: ILogger;

      private talker1 = new Talker();
      private talker2 = new Talker();

      public doSomethingWithMessage(message1: string, message2: string) {
        this.logger.log(`Doing something with:`, { message1, message2 });
        this.talker1.say(message1);
        this.talker2.say(message2);
        this.logger.errorLazy(() => ["Lazily saying that I am done.", "HEUHUEhueheuhUE"]);
      }
    }

    const instance = new SampleClass();

    instance.doSomethingWithMessage("hello", "world");

    expect(handleItem).toHaveBeenNthCalledWith(1, {
      args: ["Doing something with:", { message1: "hello", message2: "world" }],
      level: LogLevel.Log,
      namespaces: [{ id: null, namespace: "SampleClass" }]
    });
    expect(handleItem).toHaveBeenNthCalledWith(2, {
      args: ["I am saying: hello..."],
      level: LogLevel.Warn,
      namespaces: [{ id: null, namespace: "SampleClass" }, { id: 0, namespace: "Talker" }]
    });
    expect(handleItem).toHaveBeenNthCalledWith(3, {
      args: ["I am saying: world..."],
      level: LogLevel.Warn,
      namespaces: [{ id: null, namespace: "SampleClass" }, { id: 1, namespace: "Talker" }]
    });
    expect(handleItem).toHaveBeenNthCalledWith(4, {
      args: ["Lazily saying that I am done.", "HEUHUEhueheuhUE"],
      level: LogLevel.Error,
      namespaces: [{ id: null, namespace: "SampleClass" }]
    });
  });

  it("should work with renamed dependency path", () => {
    const handleItem = jest.fn<void, [ILoggetTransportHandleItemOptions]>();

    const { injectScopedLoger } = createScopedLogger({
      transports: [
        new TestingLoggerTransport({
          handleItem
        })
      ]
    });

    let nextTalkerID = 0;

    @setNamespaceName("TALKER_YO")
    @injectScopedLoger
    class Talker {
      private id = nextTalkerID++;
      protected logger!: ILogger;

      public say(message: string) {
        this.logger.warn(`I am saying: ${message}...`);
      }
    }

    @injectScopedLoger
    class SampleClass {
      protected logger!: ILogger;

      private talker1 = new Talker();
      private talker2 = new Talker();

      public doSomethingWithMessage(message1: string, message2: string) {
        this.logger.log(`Doing something with:`, { message1, message2 });
        this.talker1.say(message1);
        this.talker2.say(message2);
        this.logger.errorLazy(() => ["Lazily saying that I am done.", "HEUHUEhueheuhUE"]);
      }
    }

    const instance = new SampleClass();

    instance.doSomethingWithMessage("hello", "world");

    expect(handleItem).toHaveBeenNthCalledWith(1, {
      args: ["Doing something with:", { message1: "hello", message2: "world" }],
      level: LogLevel.Log,
      namespaces: [{ id: null, namespace: "SampleClass" }]
    });
    expect(handleItem).toHaveBeenNthCalledWith(2, {
      args: ["I am saying: hello..."],
      level: LogLevel.Warn,
      namespaces: [{ id: null, namespace: "SampleClass" }, { id: 0, namespace: "TALKER_YO" }]
    });
    expect(handleItem).toHaveBeenNthCalledWith(3, {
      args: ["I am saying: world..."],
      level: LogLevel.Warn,
      namespaces: [{ id: null, namespace: "SampleClass" }, { id: 1, namespace: "TALKER_YO" }]
    });
    expect(handleItem).toHaveBeenNthCalledWith(4, {
      args: ["Lazily saying that I am done.", "HEUHUEhueheuhUE"],
      level: LogLevel.Error,
      namespaces: [{ id: null, namespace: "SampleClass" }]
    });
  });

  it("should work with inheritance", () => {
    const handleItem = jest.fn<void, [ILoggetTransportHandleItemOptions]>();

    const { injectScopedLoger } = createScopedLogger({
      transports: [
        new TestingLoggerTransport({
          handleItem
        })
      ]
    });

    let nextTalkerID = 0;

    @injectScopedLoger
    abstract class AbstractTalker {
      private id = nextTalkerID++;
      protected logger!: ILogger;

      public abstract say(message: string): void;
    }

    class YellingTalker extends AbstractTalker {
      public say(message: string) {
        this.logger.warn(`I am saying: ${message}...`.toUpperCase());
      }
    }

    @injectScopedLoger
    class SampleClass {
      protected logger!: ILogger;

      private talker1: AbstractTalker = new YellingTalker();
      private talker2: AbstractTalker = new YellingTalker();

      public doSomethingWithMessage(message1: string, message2: string) {
        this.logger.log(`Doing something with:`, { message1, message2 });
        this.talker1.say(message1);
        this.talker2.say(message2);
        this.logger.errorLazy(() => ["Lazily saying that I am done.", "HEUHUEhueheuhUE"]);
      }
    }

    const instance = new SampleClass();

    instance.doSomethingWithMessage("hello", "world");

    expect(handleItem).toHaveBeenNthCalledWith(1, {
      args: ["Doing something with:", { message1: "hello", message2: "world" }],
      level: LogLevel.Log,
      namespaces: [{ id: null, namespace: "SampleClass" }]
    });
    expect(handleItem).toHaveBeenNthCalledWith(2, {
      args: ["I AM SAYING: HELLO..."],
      level: LogLevel.Warn,
      namespaces: [{ id: null, namespace: "SampleClass" }, { id: 0, namespace: "YellingTalker" }]
    });
    expect(handleItem).toHaveBeenNthCalledWith(3, {
      args: ["I AM SAYING: WORLD..."],
      level: LogLevel.Warn,
      namespaces: [{ id: null, namespace: "SampleClass" }, { id: 1, namespace: "YellingTalker" }]
    });
    expect(handleItem).toHaveBeenNthCalledWith(4, {
      args: ["Lazily saying that I am done.", "HEUHUEhueheuhUE"],
      level: LogLevel.Error,
      namespaces: [{ id: null, namespace: "SampleClass" }]
    });
  });
});
