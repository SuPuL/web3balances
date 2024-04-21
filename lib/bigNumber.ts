import BigNumber from "bignumber.js";
import _ from "lodash";
import { DECIMALS, INACCUARCY } from "../app/_common/utils";

export const ROUNDING_MODE: BigNumber.RoundingMode | undefined = undefined;

export const Zero = (): BigNumber => BigNumber(0);

export const ShiftedBN = (
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

export const safeDiff = (
  value: BigNumber,
  value2: BigNumber,
  inaccuarcy = INACCUARCY
) => {
  let diff = value.minus(value2);

  return diff.abs().lte(inaccuarcy) ? BigNumber(0) : diff;
};
