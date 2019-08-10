export const fixAsyncIteratorSymbol = () => {
  // tslint:disable-next-line
  if (typeof Symbol["asyncIterator"] === "undefined") {
    (Symbol as any)["asyncIterator"] = Symbol.for("asyncIterator");
  }
};
