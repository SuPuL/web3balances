import { NormDecimal, Zero, fromChainToBD, safeDiff } from "@lib/decimals";
import { MoralisApi, getMoralisEvmChain } from "@lib/moralis";
import { EvmAddress } from "@moralisweb3/common-evm-utils";
import { Entry, EntryType, PrismaClient, Wallet } from "@prisma/client";
import Decimal from "decimal.js";
import { first } from "lodash";
import Moralis from "moralis";

type Options = {
  walletIds?: number[];
  moralisApiKey?: string;
};

type di = {
  chain: MoralisApi;
  db: PrismaClient;
};

let DI: di;
const init = async ({ moralisApiKey: apiKey }: Options) => {
  await Moralis.start({ apiKey });

  DI = {
    chain: Moralis,
    db: new PrismaClient(),
  };
};

export const importWalletStats = async ({ walletIds, ...rest }: Options) => {
  await init(rest);

  const wallets = await DI.db.wallet.findMany({
    where: walletIds ? { id: { in: walletIds } } : {},
  });

  for (const wallet of wallets) {
    console.log(`Import: wallet ${wallet.id}.`);
    await importStats(wallet);
  }

  console.log(`Done 👍`);
};

const toShortDecimal = (value: Decimal) => NormDecimal(value, 4);

const importStats = async (wallet: Wallet) => {
  const walletId = wallet.id;
  const onChainBalance = toShortDecimal(await getOnChainBalance(wallet));
  const onChainBalanceLocal = toShortDecimal(
    (await getEntryByType(walletId, wallet.type))?.balance || Zero()
  );
  const serviceBalanceLocal = toShortDecimal(
    (await getEntryByType(walletId, "SERVICE"))?.balance || Zero()
  );

  await DI.db.wallet.update({
    where: { id: walletId },
    data: {
      serviceBalanceLocal,
      serviceBalanceDiff: safeDiff(
        toShortDecimal(wallet.serviceBalance),
        serviceBalanceLocal
      ),
      onChainBalance,
      onChainBalanceLocal,
      onChainBalanceDiff: safeDiff(
        toShortDecimal(wallet.onChainBalance),
        onChainBalanceLocal
      ),
    },
  });
};

const getEntryByType = async (
  walletId: number,
  type: EntryType
): Promise<Entry | null> =>
  DI.db.entry.findFirst({
    where: {
      walletId,
      type,
      ignored: false,
    },
    orderBy: {
      id: "desc",
    },
    take: 1,
  });

const getOnChainBalance = async (wallet: Wallet): Promise<Decimal> => {
  switch (wallet.type) {
    case "NATIVE":
      return wallet.chain === "SOLANA"
        ? getOnChainSolNativeBalance(wallet)
        : getOnChainEVMNativeBalance(wallet);
    case "ERC20":
      return getOnChainEVMTokenBalance(wallet);
    default:
      return Zero();
  }
};

const getOnChainSolNativeBalance = async (wallet: Wallet): Promise<Decimal> => {
  if (wallet.chain !== "SOLANA" || !wallet.walletAddress) {
    return Zero();
  }

  const result = (
    await DI.chain.SolApi.account.getBalance({ address: wallet.walletAddress })
  ).toJSON();
  return fromChainToBD(result.lamports, wallet.decimals);
};

const getOnChainEVMNativeBalance = async (wallet: Wallet): Promise<Decimal> => {
  const chain = wallet.chain ? getMoralisEvmChain(wallet.chain) : undefined;
  if (!chain || !wallet.walletAddress) {
    return Zero();
  }

  const address = EvmAddress.create(wallet.walletAddress);
  const result = (
    await DI.chain.EvmApi.balance.getNativeBalance({ address, chain })
  ).toJSON();
  return fromChainToBD(result.balance, wallet.decimals);
};

const getOnChainEVMTokenBalance = async (wallet: Wallet): Promise<Decimal> => {
  const chain = wallet.chain ? getMoralisEvmChain(wallet.chain) : undefined;
  if (!chain || !wallet.walletAddress || !wallet.tokenAddress) {
    return Zero();
  }

  const address = EvmAddress.create(wallet.walletAddress);
  const tokenAddres = EvmAddress.create(wallet.tokenAddress);
  const result = (
    await DI.chain.EvmApi.token.getWalletTokenBalances({
      address,
      chain,
      tokenAddresses: [tokenAddres],
    })
  ).toJSON();

  const firstResult = first(result);

  return fromChainToBD(
    firstResult?.balance,
    firstResult?.decimals || wallet.decimals
  );
};
