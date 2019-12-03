import { ClassType } from "../../../types";
import { getNamespacesList, registerDependencyPath } from "../../dependency-path";
import { LogLevel } from "../LogLevel";
import { ILoggerTransport } from "../transports";
import { LogFunctionArguments, LogFunctionLazyArgument } from "../types";
import { InjectableLogger } from "./InjectableLogger";

export interface IScopedLogerOptions {
  transports: ILoggerTransport[];
}

export class ScopedLoger {
  constructor(private options: IScopedLogerOptions) {}

  private handleLogItemOnTarget(
    level: LogLevel,
    args: LogFunctionArguments | LogFunctionLazyArgument,
    target: Object
  ): void {
    const namespaces = getNamespacesList(target);

    // middleware/filter?

    const finalArgs = this.getArgsArray(args);

    this.options.transports.forEach(transport =>
      transport.handleItem({
        level,
        args: finalArgs,
        namespaces
      })
    );
  }

  private getArgsArray(args: LogFunctionArguments | LogFunctionLazyArgument): LogFunctionArguments {
    if (typeof args === "function") {
      return args();
    }

    return args;
  }

  public injectScopedLoggerDecorator = (cstr: any) => {
    return registerDependencyPath({
      onInstanceCreation: target => {
        const localLogger = new InjectableLogger({
          handleLogItem: (type, args) => this.handleLogItemOnTarget(type, args, target)
        });

        target["logger"] = localLogger;
      }
    })(cstr);
  };
}
