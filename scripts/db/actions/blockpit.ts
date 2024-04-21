import { BlockpitData, DownloadOptions, downloadData } from "@lib/blockpit";
import { NormDecimal } from "@lib/decimals";
import { Prisma, PrismaClient, Wallet } from "@prisma/client";
import { parse } from "date-fns";

const years = [2021, 2022, 2023, 2024, 2025];

type Options = Omit<DownloadOptions, "year">;

export const importBlockpit = async (options: Options) => {
  console.info(`Importing blockpit transactions. Start download...`);

  // delete old transactions
  const prisma = new PrismaClient();
  // get wallets
  const wallets = await prisma.wallet.findMany();
  await prisma.blockpitTransaction.deleteMany();

  for (const year of years) {
    console.log(`Download transactions for year ${year}.`);
    const transactions = await downloadData({
      ...options,
      year,
    });

    console.log(`Found ${transactions.length} transactions for year ${year}.`);

    for (const wallet of wallets) {
      const transactionsForWallet = transactions.filter(
        (t) =>
          t.integration?.toLowerCase() === wallet.name.toLowerCase() &&
          [t.incomingAsset, t.outgoingAsset, t.feeAsset].includes(wallet.symbol)
      );

      if (transactionsForWallet.length > 0) {
        await prisma.blockpitTransaction.createMany({
          data: transform(wallet, transactionsForWallet),
        });

        console.log(
          `Inserted ${transactionsForWallet.length} transactions for wallet ${wallet.id}.`
        );
      }
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
      tx.transactionId || extractHexadecimalString(tx.note) || "";

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
