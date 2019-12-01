export const sleep = async (ms: number, unref?: boolean) =>
  new Promise<void>(resolve => {
    const timeout = setTimeout(resolve, ms);

    if ((timeout as any).unref && unref) {
      (timeout as any).unref();
    }
  });
