import { fromChainToBD, NormDecimal } from "@lib/decimals";
import {
  EvmAddress,
  EvmChain,
  EvmWalletHistoryTransaction,
  EvmWalletHistoryTransactionInput,
} from "@moralisweb3/common-evm-utils";
import { NativeTransactionType, Prisma, Wallet } from "@prisma/client";
import _, { isNull } from "lodash";
import { MoralisApi } from "./types";
import { getMoralisEvmChain } from "./utils";

const transform = (
  wallet: Wallet,
  transfers: EvmWalletHistoryTransactionInput[]
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
      const gasUsed = NormDecimal(
        transfer.receiptGasUsed?.toString() || 0,
        decimals
      );
      const cumulativeGasUsed = NormDecimal(
        transfer.receiptCumulativeGasUsed.toString() || 0,
        decimals
      );
      const gasPrice = fromChainToBD(
        transfer.gasPrice?.toString() || 0,
        decimals
      );

      const toAddress = EvmAddress.create(transfer.toAddress);
      const fromAddress = EvmAddress.create(transfer.fromAddress);

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
        index: transfer.transactionIndex.toString(),
        blockHash: transfer.blockHash,
        blockNumber: transfer.blockNumber.toString(),
        blockTimestamp: transfer.blockTimestamp,
        transactionHash: transfer.hash,
        contractAddress: "",
        walletId: wallet.id,
      };

      let extraTx = transfer.nativeTransfers
        .filter(({ internalTransaction }) => internalTransaction)
        .reduce((accum, internal) => {
          const toAddress = internal.toAddress
            ? EvmAddress.create(internal.toAddress)
            : undefined;
          const fromAddress = EvmAddress.create(internal.fromAddress);

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
        }, [] as Prisma.MoralisNativeTransactionCreateManyInput[]);

      if (
        !toAddress?.equals(walletAddress) &&
        !fromAddress.equals(walletAddress)
      ) {
        return [...accum, ...extraTx];
      }

      return [...accum, baseTx, ...extraTx];
    }, [] as Prisma.MoralisNativeTransactionCreateManyInput[]);
};

async function getTransfersForAccount(
  moralis: MoralisApi,
  walletAddress: string,
  chain: EvmChain,
  _fromDate?: Date
): Promise<EvmWalletHistoryTransaction[]> {
  const result: EvmWalletHistoryTransaction[] = [];
  let cursor: string | undefined;

  const fromDate = _fromDate
    ? (_fromDate.getTime() / 1000).toString()
    : undefined;

  let response = await moralis.EvmApi.wallets.getWalletHistory({
    address: walletAddress,
    chain: chain,
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

export const getTxsByHistory = async (
  moralis: MoralisApi,
  wallet: Wallet,
  fromDate?: Date
) => {
  const mChain = getMoralisEvmChain(wallet.chain);
  if (!mChain || !wallet.walletAddress) {
    return [];
  }

  const transactions = await getTransfersForAccount(
    moralis,
    wallet.walletAddress,
    mChain,
    fromDate
  );
  const data = transform(wallet, transactions);

  return data;
};
