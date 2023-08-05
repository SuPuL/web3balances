import BigNumber from "bignumber.js";
import { Wallet, TokenInfo } from "./types";

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

export const toWallet = (info: TokenInfo): Wallet => ({
  name: info.name,
  address: info.address,
  currency: info.currency,
});

export const areWalletsEq = (
  wallet: Wallet | undefined,
  info: Wallet | undefined
): boolean =>
  !!wallet &&
  !!info &&
  wallet.name === info.name &&
  wallet.address === info.address &&
  wallet.currency === info.currency;

export const isWalletEqInfo = (
  wallet: Wallet | undefined,
  info: TokenInfo | undefined
): boolean =>
  !!wallet &&
  !!info &&
  wallet.name === info.name &&
  wallet.address === info.address &&
  wallet.currency === info.currency;

export const areWalletsInfoEq = (
  wallet: TokenInfo | undefined,
  info: TokenInfo | undefined
): boolean => {
  const isEq =
    !!wallet &&
    !!info &&
    wallet.name === info.name &&
    wallet.address === info.address &&
    wallet.currency === info.currency;

  return isEq;
};
