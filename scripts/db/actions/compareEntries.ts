import { initDI } from "@lib/di";
import { compareEntriesForWallet } from "@lib/entry/compareEntries";

type Options = {
  walletIds?: number[];
};

export const compareEntries = async ({ walletIds, ...rest }: Options) => {
  const di = await initDI(rest);

  // get wallets
  const wallets = await di.db.wallet.findMany({
    where: walletIds ? { id: { in: walletIds } } : {},
  });

  for (const wallet of wallets) {
    console.log(`Compare Entroes: wallet ${wallet.id}.`);
    const data = await compareEntriesForWallet(wallet, di);
    console.log(
      `Inserted ${data.length} transactions for wallet ${wallet.id}.`
    );
  }

  console.log(`Done 👍`);
};
