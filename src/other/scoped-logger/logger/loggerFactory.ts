import { ILoggerOptions, Logger } from "./Logger";

export interface ICreateLoggerOptions extends Omit<ILoggerOptions, "parent"> {}

export const createLogger = (options: ICreateLoggerOptions): Logger => {
  const loggerOptions: ILoggerOptions = {
    ...options,
    parent: null
  };

  return new (Logger as any)(loggerOptions);
};
