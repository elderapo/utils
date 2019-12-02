import { ILoggerTransport } from "../transports";

export interface ILoggerOptions {
  parent: Logger | null;
  scope: string;
  transports?: ILoggerTransport[];
}

export class Logger {
  private constructor(private options: ILoggerOptions) {}
}
