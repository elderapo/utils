export type CallOrderCheckerHelper = () => number;

export const createCallOrderCheckerHelper = (): CallOrderCheckerHelper => {
  let i = 0;

  return () => {
    const callID = i++;

    return callID;
  };
};
