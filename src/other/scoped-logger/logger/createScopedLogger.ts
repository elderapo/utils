import { ClassType } from "../../../types";
import { getNamespacesList, registerDependencyPath } from "../../dependency-path";
import { InjectableLogger } from ".";
import { LogLevel } from "../LogLevel";
import { ILoggerTransport } from "../transports";
import { LogFunctionArguments, LogFunctionLazyArgument } from "../types";

/*
  // @TODO: filter/intercept namespaces - or just middlewares?
  2. Different transports.
  3. Namespace filter.
  4. Enable/disable namespaces with env/programatic usage.
*/

export interface ICreateScopedLoggerOptions {
  transports: ILoggerTransport[];
}

// export interface ICreateScopedLoggerResult {
//   injectScopedLoger: any; // decorator
//   rootLogger: Logger;
// }

export const createScopedLogger = (options: ICreateScopedLoggerOptions) => {
  const onItemWithNamespace = (
    level: LogLevel,
    args: LogFunctionArguments | LogFunctionLazyArgument,
    target: any
  ): void => {
    const finalArgs: any[] = [];
    if (typeof args === "function") {
      finalArgs.push(...args());
    } else {
      finalArgs.push(args);
    }

    const namespaces = getNamespacesList(target);

    const formatedNamespacesSegment = namespaces
      .map(item => {
        if (item.id !== null) {
          return `${item.namespace}_${item.id}`;
        }

        return item.namespace;
      })
      .join(" > ");

    return console.log(`[${level}] [${formatedNamespacesSegment}]:`, ...finalArgs);
  };

  // const rootLogger = new Logger({
  //   handleLogItem: (type, args) => {
  //     const finalArgs: any[] = [];
  //     if (typeof args === "function") {
  //       finalArgs.push(...args());
  //     } else {
  //       finalArgs.push(args);
  //     }

  //     return console.log(`[${type}] ${options.rootScope}:`, ...finalArgs);
  //   }
  // });

  const injectScopedLoger = (cstr: ClassType) => {
    return registerDependencyPath({
      afterInstanceCreation: (target, dependencyPath) => {
        const localLogger = new InjectableLogger({
          handleLogItem: (type, args) => {
            onItemWithNamespace(type, args, target);
          }
        });

        target["logger"] = localLogger;
      }
    })(cstr);
  };

  return {
    // rootLogger: rootLogger,
    injectScopedLoger
  };
};
