import { Deferred } from "ts-deferred";

export class EagerlyStartedAsyncIteratorBuffer<T> {
  private items: Deferred<IteratorResult<T>>[] = [];
  private isFinished: boolean = false;
  private err: Error | null = null;

  public isEmpty(): boolean {
    return this.items.length <= 0;
  }

  public push(value: T): void {
    if (this.isEmpty()) {
      this.items.push(new Deferred());
    }

    this.items[this.items.length - 1].resolve({ done: false, value });
    this.items.push(new Deferred());
  }

  public catchError(err: Error): void {
    if (this.err) {
      console.warn(`Multiple errors reported on same buffer!`);
    }

    this.err = err;
  }

  public finish(): void {
    if (this.isFinished) {
      throw new Error(`Cannot finish already finished buffer.`);
    }

    if (this.isEmpty()) {
      return;
    }

    this.items[this.items.length - 1].resolve({
      done: true,
      value: undefined as any
    });
  }

  public async waitForNext(): Promise<IteratorResult<T>> {
    if (this.isEmpty()) {
      return { done: true, value: undefined as any };
    }

    const item = this.items.shift()!;
    const result = await item.promise;

    if (result.done && this.err) {
      throw this.err;
    }

    return result;
  }
}
