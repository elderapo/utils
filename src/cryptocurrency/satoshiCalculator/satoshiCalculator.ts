import * as math from "mathjs";

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

  return math.divide(Number(satoshi), CONVERSION);
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

  return parseFloat(
    math
      .number(math.multiply(math.bignumber(bitcoin), math.bignumber(CONVERSION)).toString())
      .toString()
  );
};
