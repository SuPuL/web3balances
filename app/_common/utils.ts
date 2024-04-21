import { WalletTokenInfo } from "@app/_common";
import _ from "lodash";

export const INACCUARCY = 0.0000001;
export const DECIMALS = 8;

export const areInfoEq = (
  wallet: WalletTokenInfo | undefined,
  info: WalletTokenInfo | undefined
): boolean => {
  const isEq = !!wallet && !!info && infoKey(wallet) === infoKey(info);

  return isEq;
};

export const infoKey = (info: WalletTokenInfo): string =>
  _(info).pick(["chain", "symbol", "name"]).values().kebabCase();

export const isKeyOf = <T extends object>(
  key: string | number | symbol,
  obj: T
): key is keyof T => key in obj;
