/* istanbul ignore file */

import { isBrowser } from "./isBrowser";

export const isNodeJS = () => !isBrowser();
