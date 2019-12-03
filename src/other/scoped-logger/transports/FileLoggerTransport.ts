import * as path from "path";
import { ILoggerTransport, ILoggetTransportHandleItemOptions } from "./ILoggerTransport";
import * as jsonStringifySafe from "json-stringify-safe";
import * as fsExtra from "fs-extra";
// @ts-ignore
import * as findRemoveSync from "find-remove";

export interface IFileLoggerTransportOptions {
  directory: string;
  deleteFilesOlderThan?: number;
}

export class FileLoggerTransport implements ILoggerTransport {
  private logFileStream: fsExtra.WriteStream;

  constructor(private options: IFileLoggerTransportOptions) {
    fsExtra.ensureDirSync(options.directory);

    this.logFileStream = fsExtra.createWriteStream(
      path.join(options.directory, this.generateLogFileName())
    );

    if (typeof options.deleteFilesOlderThan === "number") {
      findRemoveSync(options.directory, {
        extensions: ".log",
        age: { seconds: options.deleteFilesOlderThan / 1000 }
      });
    }
  }

  public handleItem({ level, namespaces, args }: ILoggetTransportHandleItemOptions): void {
    const serialized = jsonStringifySafe(
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
    );

    this.logFileStream.write(serialized + "\n");

    // write serialized + \n
  }

  private generateLogFileName(): string {
    const time = new Date();

    const pad = (num: number, length: number = 2) => num.toString().padStart(length, "0");

    const year = time.getFullYear();
    const month = pad(time.getMonth() + 1);
    const day = pad(time.getDate());
    const hour = pad(time.getHours());
    const minute = pad(time.getMinutes());
    const seconds = pad(time.getSeconds());
    const miliseconds = pad(time.getMilliseconds(), 3);

    return `${year}-${month}-${day}_${hour}:${minute}:${seconds}:${miliseconds}.log`;
  }
}
