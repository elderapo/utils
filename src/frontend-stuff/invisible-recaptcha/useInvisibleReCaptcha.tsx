import { useEffect, useMemo } from "react";
import { InvisibleReCaptcha } from "./InvisibleReCaptcha";

export const useInvisibleReCaptcha = (): (() => Promise<string>) => {
  const rc = useMemo(() => new InvisibleReCaptcha(), []);

  useEffect(() => {
    return () => {
      rc.delete();
    };
  }, []);

  return rc.getToken.bind(rc);
};
