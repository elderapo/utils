import chalk from "chalk";
import * as PrettyError from "pretty-error";
import * as util from "util";
import { IScopedContext } from "../../scoped-dependency";
import { LogLevel } from "../LogLevel";
import { ILoggerTransport, ILoggetTransportHandleItemOptions } from "./ILoggerTransport";
import { memoize } from "../../../decorators";

export interface IConsoleLoggerTransportOptions {
  // enable color etc
}

const logLevelFontColors = {
  [LogLevel.Log]: "green",
  [LogLevel.Info]: "blue",
  [LogLevel.Warn]: "orange",
  [LogLevel.Error]: "red"
};

export class ConsoleLoggerTransport implements ILoggerTransport {
  private nextNamespaceColorIndex: number = 0;
  private scopeColors = [
    chalk.red,
    chalk.green,
    chalk.yellow,
    chalk.blue,
    chalk.magenta,
    chalk.cyan,
    chalk.blackBright,
    chalk.redBright,
    chalk.greenBright,
    chalk.blueBright,
    chalk.magentaBright,
    chalk.cyanBright
  ];
  private prettyError = new PrettyError();

  public constructor(private options: IConsoleLoggerTransportOptions = {}) {}

  public handleItem({ level, scopes, args }: ILoggetTransportHandleItemOptions): void {
    const logFN = [LogLevel.Log, LogLevel.Info].includes(level) ? console.log : console.error;

    const logLevelColor = logLevelFontColors[level];

    const formatedNamespacesSegment = scopes
      .map(scope => this.renderNamespaceSegment(scope))
      .join(" » ");

    logFN(
      chalk.bold
        .keyword(logLevelColor)(level.toUpperCase())
        .padEnd(24),
      `${formatedNamespacesSegment}:`,
      ...args.map(item => this.formatMessageItem(item))
    );
  }

  @memoize((arg: IScopedContext) => `${arg.name}__${arg.id}`)
  private renderNamespaceSegment(segmentInfo: IScopedContext): string {
    const str =
      segmentInfo.id !== null ? `${segmentInfo.name}(${segmentInfo.id})` : segmentInfo.name;

    return this.scopeColors[this.nextNamespaceColorIndex++ % this.scopeColors.length](str);
  }

  private formatMessageItem(item: any): string {
    if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
      return item.toString();
    }

    if (item instanceof Error) {
      return `\n${this.prettyError.render(item)}`;
    }

    const inspectResult = util.inspect(item, {
      depth: 5,
      showHidden: true,
      colors: true
    });

    return inspectResult.includes("\n") ? `---wrapping-line---\n${inspectResult}` : inspectResult;
  }
}
