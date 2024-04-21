import { fromChainToBD, NormDecimal } from "@lib/decimals";
import { MoralisApi, getChain, getMoralisChain } from "@lib/moralis";
import Moralis from "moralis";
import {
  EvmAddress,
  EvmChainish,
  EvmTransaction,
  EvmTransactionData,
} from "@moralisweb3/common-evm-utils";
import {
  PrismaClient,
  TokenInfoType,
  Wallet,
  Prisma,
  NativeTransactionType,
} from "@prisma/client";
import _ from "lodash";

type Options = {
  moralisApiKey?: string;
};

export const importNativeToken = async (options: Options) => {
  console.info(`Importing native tokens from moralis`);

  await Moralis.start({
    apiKey: options.moralisApiKey,
  });

  // get wallets
  const prisma = new PrismaClient();
  const wallets = await prisma.wallet.findMany({
    where: {
      type: TokenInfoType.NATIVE,
      chain: { not: null },
    },
  });

  for (const wallet of wallets) {
    const mChain = getMoralisChain(wallet.chain);
    if (!mChain || !wallet.walletAddress) continue;

    // TODO: add force option
    // TODO: add import from date
    const alreadyImported = await prisma.moralisNativeTransaction.count({
      where: {
        wallet: wallet,
      },
    });

    if (alreadyImported > 0) {
      continue;
    }

    console.info(
      `Importing native token for wallet ${wallet.name} (${wallet.id}/${wallet.walletAddress}/${wallet.chain}/${wallet.symbol})`
    );

    const transactions = await getTransfersForAccount(
      Moralis,
      wallet.walletAddress,
      mChain
    );

    console.log(`Found ${transactions.length} transactions.`);

    await prisma.moralisNativeTransaction.createMany({
      data: transform(wallet, transactions),
    });

    console.log(`Inserted ${transactions.length} transactions.`);
  }

  console.log(`Done 👍`);
};

const transform = (
  wallet: Wallet,
  transfers: EvmTransactionData[]
): Prisma.MoralisNativeTransactionCreateManyInput[] => {
  const { decimals, walletAddress } = wallet;
  if (!walletAddress) return [];

  return _(transfers || [])
    .sortBy("blockTimestamp")
    .reduce((accum, transfer) => {
      const chain = getChain(transfer.chain);
      if (!chain) return accum;

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
      const fee = gasUsed.mul(gasPrice);

      const entry: Prisma.MoralisNativeTransactionCreateManyInput = {
        chain,
        type: NativeTransactionType.TX,
        to: transfer.to?.checksum,
        from: transfer.from.checksum,
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
        contractAddress: transfer.contractAddress?.toString(),
        walletId: wallet.id,
      };

      const internalTrans = transfer.internalTransactions.reduce(
        (accum, internal) => {
          if (
            !internal.to.equals(walletAddress) &&
            !internal.from.equals(walletAddress)
          ) {
            return accum;
          }

          const value = fromChainToBD(
            transfer.value?.toString() || 0,
            decimals
          );
          const gas = NormDecimal(transfer.gas?.toString() || 0, decimals);
          const gasUsed = NormDecimal(
            transfer.gasUsed?.toString() || 0,
            decimals
          );
          const fee = gasUsed.mul(gasPrice);

          const internalEntry: Prisma.MoralisNativeTransactionCreateManyInput =
            {
              chain,
              type: NativeTransactionType.INTERNAL_TX,
              to: internal.to.checksum,
              from: internal.from.checksum,
              nonce: null,
              gas,
              gasPrice,
              gasUsed,
              cumulativeGasUsed,
              fee,
              value,
              blockHash: internal.blockHash,
              blockNumber: internal.blockNumber.toString(),
              transactionHash: internal.transactionHash,
              walletId: wallet.id,
              blockTimestamp: transfer.blockTimestamp,
              index: transfer.index.toString(),
            };

          return [...accum, internalEntry];
        },
        [] as Prisma.MoralisNativeTransactionCreateManyInput[]
      );

      return [...accum, entry, ...internalTrans];
    }, [] as Prisma.MoralisNativeTransactionCreateManyInput[]);
};

async function getTransfersForAccount(
  moralis: MoralisApi,
  walletAddress: string,
  chain: EvmChainish
): Promise<EvmTransactionData[]> {
  const result: EvmTransaction[] = [];
  let cursor: string | undefined;

  let response = await moralis.EvmApi.transaction.getWalletTransactions({
    address: walletAddress,
    chain: chain,
    include: "internal_transactions",
    cursor,
  });

  result.push(...response.result);

  while (response.hasNext()) {
    response = await response.next();
    result.push(...response.result);
  }

  return result;
}
