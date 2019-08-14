import { bind } from "decko";
import { IteratorStateHelper } from "../IteratorStateHelper";
import { EagerlyStartedAsyncIteratorBuffer } from "./EagerlyStartedAsyncIteratorBuffer";

export class EagerlyBufferedAsyncIterator<T> implements AsyncIterableIterator<T> {
  public readonly [Symbol.asyncIterator]: () => this;

  private newIteratorState = new IteratorStateHelper();
  private buffer = new EagerlyStartedAsyncIteratorBuffer<T>();

  constructor(private originalIterator: AsyncIterableIterator<T>) {
    void this.startConsumptionOfOriginalIterator();
  }

  private async startConsumptionOfOriginalIterator(): Promise<void> {
    try {
      for await (const item of this.originalIterator) {
        if (this.newIteratorState.isErrored()) {
          break;
        }

        this.buffer.push(item);

        if (this.newIteratorState.isDone()) {
          break;
        }
      }
    } catch (ex) {
      this.buffer.catchError(ex);
    } finally {
      this.buffer.finish();
    }
  }

  @bind
  public async next(): Promise<IteratorResult<T>> {
    return this.buffer.waitForNext();
  }

  public throw(err: Error): never {
    this.newIteratorState.markAsErrored(err);

    throw err;
  }

  public async return(): Promise<IteratorResult<T>> {
    this.newIteratorState.markAsDone();

    return { done: true, value: undefined as any };
  }
}
