import { LogLevel } from "../LogLevel";
import {
  ILogger,
  LogFunctionArguments,
  LogFunctionLazyArgument,
  LogFunctionLazySignature,
  LogFunctionSignature
} from "../types";

export type LoggerHandleLoggerItem = (
  level: LogLevel,
  args: LogFunctionArguments | LogFunctionLazyArgument
) => void;

export interface ILoggerOptions {
  handleLogItem: LoggerHandleLoggerItem;
}

export class InjectableLogger implements ILogger {
  constructor(private options: ILoggerOptions) {}

  public readonly log: LogFunctionSignature = (args: LogFunctionArguments) =>
    this.options.handleLogItem(LogLevel.Log, args);

  public readonly info: LogFunctionSignature = (args: LogFunctionArguments) =>
    this.options.handleLogItem(LogLevel.Info, args);

  public readonly warn: LogFunctionSignature = (args: LogFunctionArguments) =>
    this.options.handleLogItem(LogLevel.Warn, args);

  public readonly error: LogFunctionSignature = (args: LogFunctionArguments) =>
    this.options.handleLogItem(LogLevel.Error, args);

  public readonly logLazy: LogFunctionLazySignature = (lazy: LogFunctionLazyArgument) =>
    this.options.handleLogItem(LogLevel.Log, lazy);

  public readonly infoLazy: LogFunctionLazySignature = (lazy: LogFunctionLazyArgument) =>
    this.options.handleLogItem(LogLevel.Info, lazy);

  public readonly warnLazy: LogFunctionLazySignature = (lazy: LogFunctionLazyArgument) =>
    this.options.handleLogItem(LogLevel.Warn, lazy);

  public readonly errorLazy: LogFunctionLazySignature = (lazy: LogFunctionLazyArgument) =>
    this.options.handleLogItem(LogLevel.Error, lazy);
}
