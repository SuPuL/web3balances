import { parseCsvByPath } from "@lib/csv";
import { NormDecimal, Zero, safeDiff } from "@lib/decimals";
import { PrismaClient, TokenInfoType, Wallet, Prisma } from "@prisma/client";

type WalletTokenInfoInput = Omit<
  Wallet,
  | "explorerBalance"
  | "serviceBalance"
  | "diffBalance"
  | "virtual"
  | "type"
  | "chainId"
> & {
  explorerBalance: string;
  serviceBalance: string;
  virtual: "TRUE" | "FALSE";
};

type Options = {
  databaseUrl?: string;
};

export const importCSVWallets = async (path: string, options: Options) => {
  console.info(`Importing wallets from ${path}`);

  const input = await parseCsvByPath<WalletTokenInfoInput>(path, {
    header: true,
  });

  console.log(`Found ${input.data.length} wallets. Start importing...`);

  const prisma = new PrismaClient();
  console.log(`Delete old wallets...`);
  await prisma.wallet.deleteMany();
  console.log(`Insert new wallets...`);
  await prisma.wallet.createMany({ data: transform(input.data) });

  console.log(`Done 👍`);
};

const transform = (
  data: WalletTokenInfoInput[]
): Prisma.WalletCreateManyInput[] =>
  data
    ?.filter(({ name }) => !!name)
    .map((w) => {
      const onChainBalance = NormDecimal(w.explorerBalance || 0, 4);
      const onChainBalanceLocal = Zero();
      const onChainBalanceDiff = safeDiff(Zero(), onChainBalance);
      const serviceBalance = NormDecimal(w.serviceBalance, 4);
      const serviceBalanceLocal = Zero();
      const serviceBalanceDiff = safeDiff(Zero(), serviceBalance);
      const balanceDiff = safeDiff(serviceBalance, serviceBalance);
      const decimals = Number(w.decimals || 0);

      const type = !w.tokenAddress ? TokenInfoType.NATIVE : TokenInfoType.ERC20;

      const input: Prisma.WalletCreateManyInput = {
        virtual: w.virtual.toUpperCase() === "TRUE",
        onChainBalance,
        onChainBalanceLocal,
        onChainBalanceDiff,
        serviceBalance,
        serviceBalanceLocal,
        serviceBalanceDiff,
        balanceDiff,
        decimals,
        type,
        walletAddress: w.walletAddress,
        chain: w.chain || null,
        symbol: w.symbol,
        tokenAddress: w.tokenAddress,
        name: w.name,
      };

      return input;
    });
