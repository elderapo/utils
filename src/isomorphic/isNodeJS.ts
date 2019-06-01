import { isBrowser } from "./isBrowser";

export const isNodeJS = () => !isBrowser();
