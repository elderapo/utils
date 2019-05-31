import { ChronologicalAsyncIteratorQueue, CreateIterator } from "./ChronologicalAsyncIteratorQueue";

export const createChronologicalAsyncIteratorQueue = <VALUE>(
  createIterators: CreateIterator<VALUE>[]
) => {
  const q = new ChronologicalAsyncIteratorQueue(createIterators);

  return q.finalize();
};
