import { DecimalOrZero, NormDecimal, Zero } from "@lib/decimals";
import {
  BlockpitTransaction,
  EntryType,
  Prisma,
  TokenInfoType,
  Wallet,
} from "@prisma/client";
import { Transformer } from "./transformer";
import { TransformerFactoryParams } from "./types";

const transformMethod = (
  { symbol, id, type }: Wallet,
  tx: BlockpitTransaction,
  previous?: Prisma.EntryCreateManyInput
): Prisma.EntryCreateManyInput => {
  const isNativeType = type == TokenInfoType.NATIVE;
  const isNativeFeeByType =
    isNativeType &&
    !tx.feeAmount &&
    tx.transactionType === "Fee" &&
    tx.outgoingAsset === symbol;

  let fee = Zero();
  if (isNativeFeeByType) {
    fee = NormDecimal(tx.outgoingAmount || 0);
  } else if (isNativeType) {
    fee = NormDecimal(tx.feeAmount || 0);
  }

  const ignored = tx.ignore;

  let value = Zero();
  if (!isNativeFeeByType) {
    if (tx.outgoingAsset == symbol) {
      value = NormDecimal(tx.outgoingAmount || 0).negated();
    } else if (tx.incomingAsset == symbol) {
      value = NormDecimal(tx.incomingAmount || 0);
    }
  }

  let balance = value.minus(fee);
  let feePerDay = Zero();
  let valuePerDay = Zero();

  if (!ignored) {
    let previousFeePerDay = DecimalOrZero(previous?.feePerDay);
    let previousValuePerDay = DecimalOrZero(previous?.valuePerDay);
    if (previous?.date !== tx.timestamp) {
      previousFeePerDay = Zero();
      previousValuePerDay = Zero();
    }

    feePerDay = isNativeType ? previousFeePerDay.plus(fee) : Zero();
    valuePerDay = previousValuePerDay.plus(value);
    balance = DecimalOrZero(previous?.balance).plus(value).minus(fee);
  }

  return {
    type: EntryType.SERVICE,
    walletId: id,
    date: tx.timestamp,
    balance,
    feePerDay,
    valuePerDay,
    value,
    fee,
    tx: tx.transactionId,
    method: tx.transactionType,
    ignored: tx.ignore,
  };
};

export const BlockpitTransformer = (options: TransformerFactoryParams) => {
  return new Transformer({
    ...options,
    entryType: EntryType.SERVICE,
    transformMethod,
    source: (wallet: Wallet) =>
      options.prisma.blockpitTransaction.findMany({
        where: {
          walletId: wallet.id,
          excluded: false,
        },
        orderBy: {
          timestamp: "asc",
        },
      }),
  });
};
