import * as _Crypto from "crypto";
import { isBrowser } from "./isBrowser";

type CryptoType = typeof _Crypto;

export const isomorphicCrypto: CryptoType = isBrowser()
  ? require("crypto-browserify")
  : require("crypto");
