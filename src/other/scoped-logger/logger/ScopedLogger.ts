import { listScopes, scoped } from "../../scoped-dependency";
import { LogLevel } from "../LogLevel";
import { ILoggerTransport } from "../transports";
import { LogFunctionArguments, LogFunctionLazyArgument } from "../types";
import { InjectableLogger } from "./InjectableLogger";

export interface IScopedLogerOptions {
  transports: ILoggerTransport[];
}

export interface IInjectScopedLoggerDecoratorOptions {
  name?: string;
}

export class ScopedLoger {
  constructor(private options: IScopedLogerOptions) {}

  private handleLogItemOnTarget(
    level: LogLevel,
    args: LogFunctionArguments | LogFunctionLazyArgument,
    target: Object
  ): void {
    const scopes = listScopes(target);

    // middleware/filter?

    const finalArgs = this.getArgsArray(args);

    this.options.transports.forEach(transport =>
      transport.handleItem({
        level,
        args: finalArgs,
        scopes: scopes
      })
    );
  }

  private getArgsArray(args: LogFunctionArguments | LogFunctionLazyArgument): LogFunctionArguments {
    if (typeof args === "function") {
      return args();
    }

    return args;
  }

  public injectScopedLoggerDecorator = (options: IInjectScopedLoggerDecoratorOptions = {}) => (
    cstr: any
  ) => {
    return scoped({
      name: options.name,
      onInstanceCreation: target => {
        const localLogger = new InjectableLogger({
          handleLogItem: (type, args) => this.handleLogItemOnTarget(type, args, target)
        });

        (target as any)["logger"] = localLogger;
      }
    })(cstr);
  };
}
