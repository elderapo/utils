import { Dispatch, SetStateAction, useState } from "react";
import { useIsMounted } from "./useIsMounted";

export const usePossiblyLeakingSetState = <S>(
  initialState: S | (() => S)
): [S, Dispatch<SetStateAction<S>>] => {
  const isMounted = useIsMounted();

  const [state, _setState] = useState<S>(initialState);

  const setState = (value: SetStateAction<S>): void => {
    if (!isMounted.current) {
      return;
    }

    _setState(value);
  };

  return [state, setState];
};
