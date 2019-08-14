export class IteratorStateHelper {
  private done: boolean = false;
  private err: Error | null = null;

  public isDone(): boolean {
    return this.done;
  }

  public isErrored(): boolean {
    return this.err !== null;
  }

  //   public async waitForDone(): Promise<void> {}
  //   public async waitForError(): Promise<Error> {
  //     return new Error();
  //   }

  public markAsDone(): void {
    this.done = true;
  }

  public markAsErrored(err: Error): void {
    this.err = err;
  }
}
