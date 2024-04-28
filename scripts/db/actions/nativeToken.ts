import { parseCsvByPath } from "@lib/csv";
import { NormDecimal, Zero } from "@lib/decimals";
import { getTxsByHistory } from "@lib/moralis";
import { getMoralisEvmChain } from "@lib/moralis/utils";
import { ScannerTransaction } from "@lib/scannerTransformer";
import { EvmAddress } from "@moralisweb3/common-evm-utils";
import {
  NativeTransactionType,
  Prisma,
  PrismaClient,
  TokenInfoType,
  Wallet,
} from "@prisma/client";
import fs from "fs";
import { camelCase, isNull } from "lodash";
import Moralis from "moralis";
import { resolve } from "path";

type Options = {
  moralisApiKey?: string;
  walletIds?: number[];
  importFolder?: string; // optional csv import files (needed for BNB older than 2022-01-01)
  fromDate?: Date;
  dryRun: boolean;
};

export const importNativeToken = async ({
  moralisApiKey: apiKey,
  walletIds,
  importFolder,
  fromDate,
  dryRun,
}: Options) => {
  console.info(`Importing native tokens from moralis`);

  await Moralis.start({ apiKey });

  // get wallets
  const prisma = new PrismaClient();
  const wallets = await prisma.wallet.findMany({
    where: {
      type: TokenInfoType.NATIVE,
      chain: { not: null },
      ...(walletIds ? { id: { in: walletIds } } : {}),
    },
  });

  for (const wallet of wallets) {
    console.info(
      `Importing native token for wallet ${wallet.name} (${wallet.id}/${wallet.walletAddress}/${wallet.chain}/${wallet.symbol})`
    );

    let data = importFolder
      ? await importNativeTokenFrom(importFolder, wallet, fromDate)
      : [];

    if (!data.length) {
      data = await getTxsByHistory(Moralis, wallet, fromDate);
      console.info(`Found ${data.length} transactions in Moralis.`);
    } else {
      console.info(`Found ${data.length} transactions in csv files.`);
    }

    if (!dryRun) {
      await prisma.moralisNativeTransaction.deleteMany({
        where: {
          walletId: wallet.id,
          blockTimestamp: { gte: fromDate },
        },
      });

      await prisma.moralisNativeTransaction.createMany({ data });
    }

    console.log(`Created ${data.length} transactions.`);
  }

  console.log(`Done 👍`);
};

const importNativeTokenFrom = async (
  importFolder: string,
  wallet: Wallet,
  fromDate?: Date
): Promise<Prisma.MoralisNativeTransactionCreateManyInput[]> => {
  const chain = wallet.chain;
  const mChain = getMoralisEvmChain(chain);
  if (!chain || !importFolder || !mChain || !wallet.walletAddress) {
    return [];
  }

  const path = `${importFolder}/${wallet.walletAddress.toLowerCase()}/${
    wallet.chain
  }`.replace(/\/\//g, "/");

  const txs = await readFromCsv(wallet, chain, path + "/transactions.csv");
  const iTxs = await readFromCsv(
    wallet,
    chain,
    path + "/internalTransactions.csv"
  );

  return [...txs, ...iTxs].filter(
    (tx) => !fromDate || tx.blockTimestamp >= fromDate
  );
};

async function readFromCsv(
  wallet: Wallet,
  chain: string,
  path: string
): Promise<Prisma.MoralisNativeTransactionCreateManyInput[]> {
  if (!fs.existsSync(resolve(path))) {
    return [];
  }

  const txsCsv = await parseCsvByPath<ScannerTransaction>(path, {
    header: true,
    transformHeader: (header) => cleanHeader(header, chain),
  });

  return toMoralisTx(wallet, txsCsv.data);
}

function cleanHeader(input: string, token: string): string {
  // Remove special characters, text within all kinds of brackets (including brackets themselves), numbers, and occurrences of the specified token
  const tokenRegex = new RegExp(`[\\W_]+|[\\d]+|${token}`, "gi");
  return camelCase(
    input
      .replace(tokenRegex, "")
      .replace("TxTo", "to")
      .replace("TxFrom", "from")
      .trim()
  );
}

export const toMoralisTx = (
  wallet: Wallet,
  transfers: ScannerTransaction[]
): Prisma.MoralisNativeTransactionCreateManyInput[] => {
  const { decimals, walletAddress: _walletAddress } = wallet;
  const chain = wallet.chain;
  if (!_walletAddress || isNull(chain)) return [];

  return (transfers || []).map((transfer) => {
    const valueIn = NormDecimal(transfer.valueIn?.toString() || 0, decimals);
    const valueOut = NormDecimal(transfer.valueOut?.toString() || 0, decimals);

    const gas = NormDecimal(transfer.txnFee?.toString() || 0, decimals);
    const gasUsed = gas;
    const cumulativeGasUsed = gas;
    const gasUsd = NormDecimal(transfer.txnFeeUsd?.toString() || 0, decimals);
    const gasPrice = gasUsd.gt(Zero()) ? gas.div(gasUsd) : Zero();

    const toAddress = EvmAddress.create(transfer.to);
    const fromAddress = EvmAddress.create(transfer.from);
    const fee = gas;

    const blockTimestamp = new Date(Number(transfer.unixTimestamp) * 1000);

    let value = valueIn.isZero() ? valueOut : valueIn;

    const baseTx: Prisma.MoralisNativeTransactionCreateManyInput = {
      chain,
      type: NativeTransactionType.TX,
      to: toAddress.checksum,
      from: fromAddress.checksum,
      nonce: 0,
      gas,
      gasPrice,
      gasUsed,
      cumulativeGasUsed,
      fee,
      value,
      index: "",
      blockHash: "",
      blockNumber: transfer.blockno.toString(),
      blockTimestamp,
      transactionHash: transfer.transactionHash,
      contractAddress: transfer.contractAddress,
      walletId: wallet.id,
    };

    return baseTx;
  });
};
