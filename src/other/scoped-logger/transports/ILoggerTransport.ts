import { INamespaceItem } from "../../dependency-path";
import { LogLevel } from "../LogLevel";
import { LogFunctionArguments } from "../types";

export interface ILoggetTransportHandleItemOptions {
  level: LogLevel;
  args: LogFunctionArguments;
  namespaces: INamespaceItem[];
}

export interface ILoggerTransport {
  handleItem(options: ILoggetTransportHandleItemOptions): void;
}
