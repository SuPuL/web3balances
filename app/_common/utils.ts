import BigNumber from "bignumber.js";
import { WalletTokenInfo } from "./types";

export const INACCUARCY = 0.0000001;
export const DECIMALS = 8;
export const ROUNDING_MODE: BigNumber.RoundingMode | undefined = undefined;

export const Zero = (): BigNumber => BigNumber(0);

export const BigDecimal = (
  value: string | number | BigNumber | undefined = 0,
  decimals: number = 0
) =>
  BigNumber(value).shiftedBy(-decimals).decimalPlaces(DECIMALS, ROUNDING_MODE);

export const NormBN = (
  value: string | number | BigNumber | undefined = 0,
  decimals = DECIMALS
): BigNumber => BigNumber(value).decimalPlaces(decimals, ROUNDING_MODE);

export const roundedDiff = (
  value: string | number | BigNumber,
  value2: string | number | BigNumber
): BigNumber => NormBN(value).minus(NormBN(value2));

export const isKeyOf = <T extends object>(
  key: string | number | symbol,
  obj: T
): key is keyof T => key in obj;

export const safeDiff = (
  value: BigNumber,
  value2: BigNumber,
  inaccuarcy = INACCUARCY
) => {
  let diff = value.minus(value2);

  return diff.abs().lte(inaccuarcy) ? BigNumber(0) : diff;
};

export const areInfoEq = (
  wallet: WalletTokenInfo | undefined,
  info: WalletTokenInfo | undefined
): boolean => {
  const isEq =
    !!wallet &&
    !!info &&
    wallet.chain === info.chain &&
    wallet.symbol === info.symbol &&
    wallet.walletAddress === info.walletAddress &&
    wallet.tokenAddress === info.tokenAddress;

  return isEq;
};
