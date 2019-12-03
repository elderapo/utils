import { ILoggerTransport, ILoggetTransportHandleItemOptions } from "./ILoggerTransport";

export interface ITestingLoggerTransportOptions {
  handleItem: (item: ILoggetTransportHandleItemOptions) => void;
}

export class TestingLoggerTransport implements ILoggerTransport {
  public constructor(private options: ITestingLoggerTransportOptions) {}

  public handleItem(item: ILoggetTransportHandleItemOptions): void {
    this.options.handleItem(item);
  }
}
