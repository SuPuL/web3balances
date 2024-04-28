import { fromChainToBD, NormDecimal } from "@lib/decimals";
import {
  EvmAddress,
  EvmChain,
  EvmTransaction,
  EvmTransactionInput,
} from "@moralisweb3/common-evm-utils";
import { NativeTransactionType, Prisma, Wallet } from "@prisma/client";
import _, { isNull } from "lodash";
import { MoralisApi } from "./types";
import { getMoralisEvmChain } from "./utils";

const transform = (
  wallet: Wallet,
  transfers: EvmTransactionInput[]
): Prisma.MoralisNativeTransactionCreateManyInput[] => {
  const { decimals, walletAddress: _walletAddress } = wallet;
  const chain = wallet.chain;
  if (!_walletAddress || isNull(chain)) return [];

  const walletAddress = EvmAddress.create(_walletAddress);

  return _(transfers || [])
    .sortBy("blockTimestamp")
    .reduce((accum, transfer) => {
      const value = fromChainToBD(transfer.value?.toString() || 0, decimals);
      const gas = NormDecimal(transfer.gas?.toString() || 0, decimals);
      const gasUsed = NormDecimal(transfer.gasUsed?.toString() || 0, decimals);
      const cumulativeGasUsed = NormDecimal(
        transfer.cumulativeGasUsed.toString() || 0,
        decimals
      );
      const gasPrice = fromChainToBD(
        transfer.gasPrice?.toString() || 0,
        decimals
      );

      const toAddress = EvmAddress.create(transfer.to || "");
      const fromAddress = EvmAddress.create(transfer.from);

      const fee = gasUsed.mul(gasPrice);

      const baseTx: Prisma.MoralisNativeTransactionCreateManyInput = {
        chain,
        type: NativeTransactionType.TX,
        to: toAddress.checksum,
        from: fromAddress.checksum,
        nonce: transfer.nonce?.toString(),
        gas,
        gasPrice,
        gasUsed,
        cumulativeGasUsed,
        fee,
        value,
        index: transfer.index.toString(),
        blockHash: transfer.blockHash,
        blockNumber: transfer.blockNumber.toString(),
        blockTimestamp: transfer.blockTimestamp,
        transactionHash: transfer.hash,
        contractAddress: "",
        walletId: wallet.id,
      };

      let extraTx = (transfer.internalTransactions || []).reduce(
        (accum, internal) => {
          const toAddress = EvmAddress.create(internal.to || "");
          const fromAddress = EvmAddress.create(internal.from);

          const value = fromChainToBD(
            internal.value?.toString() || 0,
            decimals
          );

          if (
            !toAddress?.equals(walletAddress) &&
            !fromAddress.equals(walletAddress)
          ) {
            return accum;
          }

          const nativeEntry: Prisma.MoralisNativeTransactionCreateManyInput = {
            ...baseTx,
            to: toAddress?.checksum,
            from: fromAddress.checksum,
            value,
          };

          return [...accum, nativeEntry];
        },
        [] as Prisma.MoralisNativeTransactionCreateManyInput[]
      );

      if (
        !toAddress?.equals(walletAddress) &&
        !fromAddress.equals(walletAddress)
      ) {
        return [...accum, ...extraTx];
      }

      return [...accum, baseTx, ...extraTx];
    }, [] as Prisma.MoralisNativeTransactionCreateManyInput[]);
};

async function getTransactions(
  moralis: MoralisApi,
  walletAddress: string,
  chain: EvmChain,
  _fromDate?: Date
): Promise<EvmTransaction[]> {
  const result: EvmTransaction[] = [];
  let cursor: string | undefined;

  const fromDate = _fromDate
    ? (_fromDate.getTime() / 1000).toString()
    : undefined;

  let response = await moralis.EvmApi.transaction.getWalletTransactions({
    address: walletAddress,
    chain: chain,
    include: "internal_transactions",
    cursor,
    fromDate,
  });

  result.push(...response.result);

  while (response.hasNext()) {
    response = await response.next();
    result.push(...response.result);
  }

  return result;
}

export const getNativeTxsByTransactions = async (
  moralis: MoralisApi,
  wallet: Wallet,
  fromDate?: Date
) => {
  const mChain = getMoralisEvmChain(wallet.chain);
  if (!mChain || !wallet.walletAddress) {
    return [];
  }

  const transactions = await getTransactions(
    moralis,
    wallet.walletAddress,
    mChain,
    fromDate
  );
  const data = transform(wallet, transactions);

  return data;
};
