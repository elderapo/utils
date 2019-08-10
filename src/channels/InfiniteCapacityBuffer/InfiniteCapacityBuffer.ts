import { ChannelBuffer } from "@channel/channel";

export class InfiniteCapacityBuffer<T> implements ChannelBuffer<T> {
  private arr: T[] = [];

  public get empty(): boolean {
    return this.arr.length === 0;
  }

  public get full(): boolean {
    return false;
  }

  public add(value: T): void {
    this.arr.push(value);
  }

  public remove(): T {
    if (this.empty) {
      throw new Error("Buffer empty");
    }

    return this.arr.shift()!;
  }
}
