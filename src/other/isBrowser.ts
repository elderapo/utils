/* istanbul ignore file */

// tslint:disable-next-line
export const isBrowser = () => typeof process === "undefined" || (process as any).browser;
