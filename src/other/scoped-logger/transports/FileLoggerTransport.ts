import * as path from "path";
import * as rfs from "rotating-file-stream";
import { ILoggerTransport, ILoggetTransportHandleItemOptions } from "./ILoggerTransport";
import * as jsonStringifySafe from "json-stringify-safe";

export interface IFileLoggerTransportOptions extends rfs.Options {
  // enable color etc
}

export class FileLoggerTransport implements ILoggerTransport {
  constructor(private optons: IFileLoggerTransportOptions) {}

  private stream = rfs.createStream("test.log", {
    path: path.join(__dirname, "tmp-logs")
  });

  public handleItem({ level, namespaces, args }: ILoggetTransportHandleItemOptions): void {
    this.stream.write(
      jsonStringifySafe(
        {
          level,
          time: new Date(),
          scope: namespaces.map(item => `${item.namespace}(${item.id})`).join(":"),
          args
        },
        (name, value) => {
          if (value instanceof Error) {
            return {
              error: true,
              name: value.name,
              message: value.message,
              stack: value.stack
            };
          }

          return value;
        }
      ) + "\n"
    );
  }
}
