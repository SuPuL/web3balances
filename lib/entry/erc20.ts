import { DecimalOrZero, Zero } from "@lib/decimals";
import {
  EntryType,
  MoralisErc20Transaction,
  Prisma,
  TokenInfoType,
  Wallet,
} from "@prisma/client";
import { Transformer } from "./transformer";
import { TransformerFactoryParams } from "./types";
import { EvmAddress } from "@moralisweb3/common-evm-utils";
import { zeroAddress } from "viem";
import { isSameDay } from "date-fns";

const transformMethod = (
  { id, type, walletAddress }: Wallet,
  tx: MoralisErc20Transaction,
  previous?: Prisma.EntryCreateManyInput
): Prisma.EntryCreateManyInput => {
  if (type != TokenInfoType.ERC20) {
    throw new Error(`Invalid wallet type ${type}`);
  }

  const walletEvmAddress = EvmAddress.create(walletAddress || zeroAddress);
  const fromAddress = EvmAddress.create(tx.fromAddress);

  let value = tx.value;
  if (fromAddress.equals(walletEvmAddress)) {
    value = value.negated();
  }

  const balance = DecimalOrZero(previous?.balance).plus(value);
  let previousValuePerDay = DecimalOrZero(previous?.valuePerDay);
  if (!previous?.date || !isSameDay(tx.blockTimestamp, previous?.date)) {
    previousValuePerDay = Zero();
  }
  const valuePerDay = previousValuePerDay.plus(value);

  return {
    type: EntryType.ERC20,
    walletId: id,
    date: tx.blockTimestamp,
    balance,
    feePerDay: Zero(),
    valuePerDay,
    value,
    fee: Zero(),
    tx: tx.transactionHash,
    method: value.gte(0) ? "deposit" : "withdraw",
    ignored: false,
  };
};

export const Erc20Transformer = (options: TransformerFactoryParams) => {
  return new Transformer<MoralisErc20Transaction>({
    ...options,
    entryType: EntryType.ERC20,
    transformMethod,
    source: (wallet: Wallet) =>
      options.prisma.moralisErc20Transaction.findMany({
        where: {
          walletId: wallet.id,
        },
        orderBy: {
          blockTimestamp: "asc",
        },
      }),
  });
};
