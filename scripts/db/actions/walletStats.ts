import { initDI } from "@lib/di";
import { calculateForWallet } from "@lib/wallets";

type Options = {
  walletIds?: number[];
};

export const importWalletStats = async ({ walletIds, ...rest }: Options) => {
  const di = await initDI(rest);

  const wallets = await di.db.wallet.findMany({
    where: walletIds ? { id: { in: walletIds } } : {},
  });

  for (const wallet of wallets) {
    console.log(`Import: wallet ${wallet.id}.`);
    await calculateForWallet(wallet, di);
  }

  console.log(`Done 👍`);
};
