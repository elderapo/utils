import { Deferred } from "ts-deferred";

export class EagerlyStartedAsyncIteratorBuffer<T> {
  private items: Deferred<IteratorResult<T>>[] = [];
  private isFinished: boolean = false;
  private err: Error | null = null;

  private pushDefer = new Deferred<IteratorResult<T>>();
  private finishDefer = new Deferred<void>();
  private errorDefer = new Deferred<Error>();

  public isEmpty(): boolean {
    return this.items.length <= 0;
  }

  public push(value: T): void {
    if (this.isEmpty()) {
      this.items.push(new Deferred());
    }

    const result = { done: false, value };

    this.items[this.items.length - 1].resolve(result);
    this.items.push(new Deferred());

    this.pushDefer.resolve(result);
    this.pushDefer = new Deferred();
  }

  public catchError(err: Error): void {
    /* istanbul ignore next */
    if (this.err) {
      console.warn(`Multiple errors reported on same buffer!`);
      return;
    }

    this.err = err;
    this.errorDefer.resolve(err);
  }

  public finish(): void {
    /* istanbul ignore next */
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

    this.finishDefer.resolve();
  }

  public async waitForNext(): Promise<IteratorResult<T>> {
    if (this.isEmpty()) {
      await Promise.race([
        this.pushDefer.promise,
        this.finishDefer.promise,
        this.errorDefer.promise
      ]);
    }

    if (this.isEmpty() || this.isFinished) {
      return { done: true, value: undefined as any };
    }

    /* istanbul ignore next */
    if (this.isEmpty() && this.err) {
      throw this.err;
    }

    const item = this.items[0];
    const result = await item.promise;

    const index = this.items.indexOf(item);

    /* istanbul ignore next */
    if (index !== -1) {
      this.items.splice(index, 1);
    }

    if (result.done && this.err) {
      throw this.err;
    }

    return result;
  }
}
