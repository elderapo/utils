import { IScopedLogerOptions, ScopedLoger } from "./ScopedLogger";

/*
  // @TODO: filter/intercept namespaces - or just middlewares?
  2. Different transports.
  3. Namespace filter.
  4. Enable/disable namespaces with env/programatic usage.
*/

export const createScopedLogger = (options: IScopedLogerOptions) => {
  const scopedLogger = new ScopedLoger(options);

  return {
    injectScopedLoger: scopedLogger.injectScopedLoggerDecorator
  };
};
