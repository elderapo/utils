export const waitImmediate = async () => new Promise<void>(resolve => setImmediate(resolve));
