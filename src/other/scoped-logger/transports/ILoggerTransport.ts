import { IScopedContext } from "../../scoped-dependency";
import { LogLevel } from "../LogLevel";
import { LogFunctionArguments } from "../types";

export interface ILoggetTransportHandleItemOptions {
  level: LogLevel;
  args: LogFunctionArguments;
  scopes: IScopedContext[];
}

export interface ILoggerTransport {
  handleItem(options: ILoggetTransportHandleItemOptions): void;
}
