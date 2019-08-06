// const Big = require("big.js"); // do not chage lul
import Big from "big.js";

const isInteger = (num: any) => typeof num === "number" && num % 1 === 0;
const toNumber = (notNum: string | number) => Number(notNum);

const CONVERSION = 100_000_000;

export const satoshiToBitcoin = (
  satoshi: number | string,
  skipIsIntCheck: boolean = false
): number => {
  let satoshiType = typeof satoshi;
  if (satoshiType === "string") {
    satoshi = toNumber(satoshi);
    satoshiType = "number";
  }

  if (satoshiType !== "number") {
    throw new TypeError(
      `satoshiToBitcoin must be called on a number or string, received: ${satoshiType}`
    );
  }

  if (!isInteger(satoshi) && !skipIsIntCheck) {
    throw new TypeError(
      `satoshiToBitcoin must be called on a whole number or string format whole number received: ${satoshi}`
    );
  }

  const bigSatoshi = new Big(satoshi);
  return Number(bigSatoshi.div(CONVERSION));
};

export const bitcoinToSatoshi = (bitcoin: number | string): number => {
  let bitcoinType = typeof bitcoin;

  if (bitcoinType === "string") {
    bitcoin = toNumber(bitcoin);
    bitcoinType = "number";
  }

  if (bitcoinType !== "number") {
    throw new TypeError(
      `bitcoinToSatoshi must be called on a number or string, received: ${bitcoinType}`
    );
  }

  const bigBitcoin = new Big(bitcoin);
  return Number(bigBitcoin.times(CONVERSION));
};
