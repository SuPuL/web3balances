import { BlockpitData, downloadData } from "@lib/blockpit";
import { NormDecimal } from "@lib/decimals";
import { Prisma, PrismaClient, Wallet } from "@prisma/client";
import { endOfYear, parse, startOfYear } from "date-fns";

const allYears = [2021, 2022, 2023, 2024, 2025];

type Options = { bearerToken: string; fromDate?: Date; walletIds?: number[] };

export const importBlockpit = async ({
  walletIds,
  fromDate,
  bearerToken,
}: Options) => {
  console.info(`Importing blockpit transactions. Start download...`);

  // delete old transactions
  const db = new PrismaClient();
  // get wallets
  const wallets = await db.wallet.findMany({
    where: walletIds ? { id: { in: walletIds } } : {},
  });

  const year = fromDate ? fromDate.getFullYear() : undefined;
  const years = year ? [year] : allYears;

  for (const year of years) {
    console.log(`Download transactions for year ${year}.`);
    const transactions = await downloadData({
      bearerToken,
      year,
    });

    for (const wallet of wallets) {
      await db.blockpitTransaction.deleteMany({
        where: {
          walletId: wallet.id,
          timestamp: {
            gte: startOfYear(new Date(year, 0, 1)),
            lte: endOfYear(new Date(year, 11, 31)),
          },
        },
      });

      console.log(
        `Found ${transactions.length} transactions for year ${year}.`
      );

      const transactionsForWallet = transactions.filter(
        (t) =>
          t.integration?.toLowerCase() === wallet.name.toLowerCase() &&
          [t.incomingAsset, t.outgoingAsset, t.feeAsset].includes(wallet.symbol)
      );

      if (transactionsForWallet.length > 0) {
        await db.blockpitTransaction.createMany({
          data: transform(wallet, transactionsForWallet),
        });
      }

      console.log(
        `Inserted ${transactionsForWallet.length} transactions for wallet ${wallet.id}.`
      );
    }
  }

  console.log(`Done 👍`);
};

const transform = (
  wallet: Wallet,
  transfers: BlockpitData[]
): Prisma.BlockpitTransactionCreateManyInput[] => {
  const { decimals, walletAddress } = wallet;
  if (!walletAddress) return [];

  return transfers.map((tx) => {
    const outgoingAmount = tx.outgoingAmount
      ? NormDecimal(tx.outgoingAmount, decimals)
      : null;
    const incomingAmount = tx.incomingAmount
      ? NormDecimal(tx.incomingAmount, decimals)
      : null;
    const feeAmount = tx.feeAmount ? NormDecimal(tx.feeAmount, decimals) : null;

    const transactionId =
      extractHexadecimalString(tx.note) || tx.transactionId || "";

    const timestamp = parse(tx.timestamp, "dd.MM.yyyy HH:mm:ss", new Date());

    return {
      walletId: wallet.id,
      blockpitId: tx.blockpitId,
      timestamp,
      sourceType: tx.sourceType,
      sourceName: tx.sourceName,
      integration: tx.integration,
      transactionType: tx.transactionType,
      outgoingAsset: tx.outgoingAsset,
      outgoingAmount,
      incomingAsset: tx.incomingAsset,
      incomingAmount,
      feeAsset: tx.feeAsset,
      feeAmount,
      transactionId,
      note: tx.note,
      mergeId: tx.mergeId,
      excluded: tx.note?.toLowerCase().includes("excluded") || false,
      ignore: false,
    };
  });
};

function extractHexadecimalString(
  multilineString?: string
): string | undefined {
  const regex = /0x[0-9a-fA-F]{64}/; // Regular expression to match a 64-character hexadecimal string starting with '0x'
  const match = multilineString?.match(regex); // Attempt to find a match in the multiline string
  return match ? match[0] : undefined; // Return the first match if found, otherwise return undefined
}
