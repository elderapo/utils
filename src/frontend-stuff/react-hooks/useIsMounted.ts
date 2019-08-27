import { useRef, useEffect } from "react";

export const useIsMounted = (): React.MutableRefObject<boolean> => {
  const isMounted = useRef<boolean>(false);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
};
