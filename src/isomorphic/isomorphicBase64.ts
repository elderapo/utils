import { isNodeJS } from "./isNodeJS";

export const isomorphicBtoa = (decoded: string): string =>
  isNodeJS() ? Buffer.from(decoded).toString("base64") : window.btoa(decoded);

export const isomorphicAtob = (encoded: string): string =>
  isNodeJS() ? Buffer.from(encoded, "base64").toString() : window.atob(encoded);
