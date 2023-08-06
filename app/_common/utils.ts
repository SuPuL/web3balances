import BigNumber from "bignumber.js";
import { Wallet, WalletTokenInfo } from "./types";

export const isKeyOf = <T extends object>(
  key: string | number | symbol,
  obj: T
): key is keyof T => key in obj;

export const areInfoEq = (
  wallet: WalletTokenInfo | undefined,
  info: WalletTokenInfo | undefined
): boolean => {
  const isEq =
    !!wallet &&
    !!info &&
    wallet.chain === info.chain &&
    wallet.walletAddress === info.walletAddress &&
    wallet.tokenAddress === info.tokenAddress;

  return isEq;
};
