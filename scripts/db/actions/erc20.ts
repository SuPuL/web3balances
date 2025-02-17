import { getEcr20TxsByHistory, getMoralisEvmChain } from "@lib/moralis";
import { Chain, PrismaClient, TokenInfoType } from "@prisma/client";
import Moralis from "moralis";

type Options = {
  moralisApiKey?: string;
  walletIds?: number[];
  fromDate?: Date;
  dryRun: boolean;
};

export const importERC20 = async ({
  moralisApiKey: apiKey,
  walletIds,
  fromDate,
  dryRun,
}: Options) => {
  console.info(`Importing erc20 from moralis`);

  await Moralis.start({ apiKey });

  // get wallets
  const prisma = new PrismaClient();
  const wallets = await prisma.wallet.findMany({
    where: {
      type: TokenInfoType.ERC20,
      chain: { not: null },
      tokenAddress: { not: null },
      ...(walletIds ? { id: { in: walletIds } } : {}),
    },
  });

  for (const wallet of wallets) {
    const mChain = getMoralisEvmChain(wallet.chain as Chain);
    if (!mChain || !wallet.walletAddress || !wallet.tokenAddress) continue;

    console.info(
      `Importing erc20 for wallet ${wallet.name} (${wallet.id}/${wallet.walletAddress}/${wallet.chain}/${wallet.symbol})`
    );

    const data = await getEcr20TxsByHistory(Moralis, wallet, fromDate);

    console.log(`Found ${data.length} transactions.`);

    if (!dryRun) {
      await prisma.moralisErc20Transaction.deleteMany({
        where: {
          walletId: wallet.id,
          blockTimestamp: { gte: fromDate },
        },
      });

      await prisma.moralisErc20Transaction.createMany({ data });
    }

    console.log(`Inserted ${data.length} transactions.`);
  }

  console.log(`Done 👍`);
};
