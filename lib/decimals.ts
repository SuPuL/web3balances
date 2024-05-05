import BigNumber from "bignumber.js";
import { Decimal } from "decimal.js";
import { DECIMALS, INACCUARCY } from "../app/_common/utils";

export interface DecimalJsLike {
  d: number[];
  e: number;
  s: number;
  toFixed(): string;
}

export const ROUNDING_MODE: Decimal.Rounding = Decimal.ROUND_FLOOR;

export const Zero = (): Decimal => new Decimal(0);

export const DecimalOrZero = (
  value: string | number | Decimal | DecimalJsLike | undefined | null = 0
): Decimal => {
  if (value === null) {
    return Zero();
  } else if (value instanceof Decimal) {
    return new Decimal(value);
  } else if (typeof value === "object") {
    return new Decimal(value.toFixed());
  }

  return new Decimal(value);
};

export const fromChainToBD = (
  value: string | number | Decimal | undefined = 0,
  decimals: number = 0
): Decimal => {
  if (value instanceof Decimal) {
    value = value.toString();
  }
  // get input shifted by decimals
  return new Decimal(BigNumber(value).shiftedBy(-decimals).toString());
};

export const NormDecimal = (
  value: string | number | Decimal | undefined = 0,
  decimals = DECIMALS
): Decimal => new Decimal(value).toDecimalPlaces(decimals, ROUNDING_MODE);

export const roundedDiff = (
  value: string | number | Decimal,
  value2: string | number | Decimal
): Decimal => NormDecimal(value).minus(NormDecimal(value2));

export const safeDiff = (
  value: Decimal,
  value2: Decimal,
  inaccuarcy = INACCUARCY
): Decimal => {
  let diff = value.minus(value2);

  return diff.abs().lte(inaccuarcy) ? Zero() : diff;
};

export const oppProps = <T>(
  entry: T,
  lastTx: T | undefined,
  prop: keyof T,
  op: (a: Decimal, b: Decimal) => Decimal
) => {
  let left = (entry?.[prop] as Decimal) || Zero();
  let right = (lastTx?.[prop] as Decimal) || Zero();

  return op(left, right);
};
