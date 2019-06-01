/* istanbul ignore file */

export const isBrowser = () => typeof process === "undefined" || (process as any).browser;
