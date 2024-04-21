import { DecimalOrZero, Zero } from "@lib/decimals";
import { EvmAddress } from "@moralisweb3/common-evm-utils";
import {
  EntryType,
  MoralisNativeTransaction,
  Prisma,
  TokenInfoType,
  Wallet,
} from "@prisma/client";
import { isSameDay } from "date-fns";
import { zeroAddress } from "viem";
import { Transformer } from "./transformer";
import { TransformerFactoryParams } from "./types";

const transformMethod = (
  { id, type, walletAddress }: Wallet,
  tx: MoralisNativeTransaction,
  previous?: Prisma.EntryCreateManyInput
): Prisma.EntryCreateManyInput => {
  if (type != TokenInfoType.NATIVE) {
    throw new Error(`Invalid wallet type ${type}`);
  }

  const walletEvmAddress = EvmAddress.create(walletAddress || zeroAddress);
  const fromAddress = EvmAddress.create(tx.from);

  let value = DecimalOrZero(tx.value);
  let fee = Zero();
  if (fromAddress.equals(walletEvmAddress)) {
    value = value.negated();
    fee = DecimalOrZero(tx.fee);
  }

  const balance = DecimalOrZero(previous?.balance).plus(value).minus(fee);

  let previousFeePerDay = DecimalOrZero(previous?.feePerDay);
  let previousValuePerDay = DecimalOrZero(previous?.valuePerDay);
  if (!previous?.date || !isSameDay(tx.blockTimestamp, previous?.date)) {
    previousFeePerDay = Zero();
    previousValuePerDay = Zero();
  }

  const feePerDay = previousFeePerDay.plus(fee);
  const valuePerDay = previousValuePerDay.plus(value);

  return {
    type: EntryType.NATIVE,
    walletId: id,
    date: tx.blockTimestamp,
    balance,
    feePerDay,
    valuePerDay,
    value,
    fee,
    tx: tx.transactionHash || "",
    method: value.gte(0) ? "deposit" : "withdraw",
    ignored: false,
  };
};

export const NativeTransformer = (options: TransformerFactoryParams) => {
  return new Transformer({
    ...options,
    entryType: EntryType.NATIVE,
    transformMethod,
    source: (wallet: Wallet) =>
      options.prisma.moralisNativeTransaction.findMany({
        where: {
          walletId: wallet.id,
        },
        orderBy: {
          blockTimestamp: "asc",
        },
      }),
  });
};
