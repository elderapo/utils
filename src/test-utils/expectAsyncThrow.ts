export const expectAsyncThrow = async <FUNCTION_ARGS extends Array<any>>(
  fn: <FUNCTION_ARGS extends Array<any>>(...args: FUNCTION_ARGS) => Promise<any> | any,
  fnArgs: FUNCTION_ARGS,
  expectedError: Error
): Promise<void> => {
  let error: Error | null = null;

  try {
    await fn(...fnArgs);
  } catch (ex) {
    error = ex;
  }

  expect(error).toEqual(expectedError);
};
