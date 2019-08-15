import { bind } from "decko";
import { EagerlyStartedAsyncIteratorBuffer } from "./EagerlyStartedAsyncIteratorBuffer";

export class EagerlyBufferedAsyncIterator<T> implements AsyncIterableIterator<T> {
  private buffer = new EagerlyStartedAsyncIteratorBuffer<T>();

  constructor(private originalIterator: AsyncIterableIterator<T>) {
    void this.startConsumptionOfOriginalIterator();
  }

  private async startConsumptionOfOriginalIterator(): Promise<void> {
    try {
      for await (const item of this.originalIterator) {
        this.buffer.push(item);
      }
    } catch (ex) {
      this.buffer.catchError(ex);
    } finally {
      this.buffer.finish();
    }
  }

  @bind
  public [Symbol.asyncIterator](): EagerlyBufferedAsyncIterator<T> {
    return this;
  }

  @bind
  public async next(): Promise<IteratorResult<T>> {
    return this.buffer.waitForNext();
  }
}
