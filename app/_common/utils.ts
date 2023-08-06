import BigNumber from "bignumber.js";
import { Wallet, WalletTokenInfo } from "./types";

export const isKeyOf = <T extends object>(
  key: string | number | symbol,
  obj: T
): key is keyof T => key in obj;

export const roundedDiff = (
  num1: number,
  num2: number,
  decimals: number = 8
): number => {
  return roundToDecimals(num1, decimals) - roundToDecimals(num2, decimals);
};

export const roundToDecimals = (
  value: number | string,
  decimals: number = 8
): number => {
  return Number(new BigNumber(value).toFixed(decimals));
};

export const sumAll = (
  values: (number | string)[],
  decimals: number = 8
): number =>
  roundToDecimals(
    values.reduce((accum: number, value) => accum + Number(value), 0),
    decimals
  );

export const areInfoEq = (
  wallet: WalletTokenInfo | undefined,
  info: WalletTokenInfo | undefined
): boolean => {
  const isEq =
    !!wallet &&
    !!info &&
    wallet.chain === info.chain &&
    wallet.walletAddress === info.walletAddress &&
    wallet.address === info.address;

  return isEq;
};
