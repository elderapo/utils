export type LogFunctionArguments = [any, ...any[]];
export type LogFunctionSignature = (...messageParts: LogFunctionArguments) => void;

export type LogFunctionLazyArgument = () => LogFunctionArguments;
export type LogFunctionLazySignature = (lazy: LogFunctionLazyArgument) => void;

export interface ILogger {
  log: LogFunctionSignature;
  info: LogFunctionSignature;
  warn: LogFunctionSignature;
  error: LogFunctionSignature;

  logLazy: LogFunctionLazySignature;
  infoLazy: LogFunctionLazySignature;
  warnLazy: LogFunctionLazySignature;
  errorLazy: LogFunctionLazySignature;
}
