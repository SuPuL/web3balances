import { EvmAddress } from "@moralisweb3/common-evm-utils";
import { Entry, EntryType, PrismaClient, Wallet } from "@prisma/client";
import Decimal from "decimal.js";
import { first } from "lodash";
import { NormDecimal, Zero, fromChainToBD, safeDiff } from "./decimals";
import { DI } from "./di";
import { MoralisApi, getMoralisEvmChain } from "./moralis";

const toShortDecimal = (value: Decimal) => NormDecimal(value, 4);

export type StatsOptions = DI;

type StatsParams = StatsOptions & {
  wallet: Wallet;
};

export const calculateStats = async (
  walletIds: number[],
  options: StatsOptions
): Promise<Wallet[]> => {
  const wallets = await options.db.wallet.findMany({
    where: { id: { in: walletIds } },
  });

  for (const wallet of wallets) {
    await calculateForWallet(wallet, options);
  }

  return await options.db.wallet.findMany({
    where: { id: { in: walletIds } },
  });
};

export const calculateForWallet = async (
  wallet: Wallet,
  { db, ...options }: StatsOptions
) => {
  const walletId = wallet.id;
  const onChainBalance = toShortDecimal(
    await getOnChainBalance({ wallet, db, ...options })
  );
  const onChainBalanceLocal = toShortDecimal(
    (await getEntryByType(db, walletId, wallet.type))?.balance || Zero()
  );
  const serviceBalance = toShortDecimal(wallet.serviceBalance);
  const serviceBalanceLocal = toShortDecimal(
    (await getEntryByType(db, walletId, "SERVICE"))?.balance || Zero()
  );

  const balanceDiff = safeDiff(onChainBalance, serviceBalance);
  const balanceCheckDiff = safeDiff(onChainBalance, serviceBalanceLocal);

  const compareEntryDiff = await getInvalidCompareEntriesCount(db, walletId);

  await db.wallet.update({
    where: { id: walletId },
    data: {
      serviceBalance,
      serviceBalanceLocal,
      serviceBalanceDiff: safeDiff(serviceBalance, serviceBalanceLocal),
      onChainBalance,
      onChainBalanceLocal,
      onChainBalanceDiff: safeDiff(onChainBalance, onChainBalanceLocal),
      balanceDiff,
      balanceCheckDiff,
      compareEntryDiff,
    },
  });
};

const getInvalidCompareEntriesCount = (db: PrismaClient, walletId: number) => {
  return db.entryComparison.count({
    where: {
      walletId,
      OR: [
        { diffBalance: { not: 0 } },
        { diffValue: { not: 0 } },
        { diffFee: { not: 0 } },
      ],
    },
  });
};

const getEntryByType = async (
  db: PrismaClient,
  walletId: number,
  type: EntryType
): Promise<Entry | null> =>
  db.entry.findFirst({
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

const getOnChainBalance = async ({
  wallet,
  chainApi,
}: StatsParams): Promise<Decimal> => {
  if (!chainApi) {
    return Zero();
  }

  switch (wallet.type) {
    case "NATIVE":
      return wallet.chain === "SOLANA"
        ? Zero()
        : getOnChainEVMNativeBalance(wallet, chainApi);
    case "ERC20":
      return getOnChainEVMTokenBalance(wallet, chainApi);
    default:
      return Zero();
  }
};

const getOnChainEVMNativeBalance = async (
  wallet: Wallet,
  chainApi: MoralisApi
): Promise<Decimal> => {
  const chain = wallet.chain ? getMoralisEvmChain(wallet.chain) : undefined;
  if (!chain || !wallet.walletAddress) {
    return Zero();
  }

  const address = EvmAddress.create(wallet.walletAddress);
  const result = (
    await chainApi.EvmApi.balance.getNativeBalance({ address, chain })
  ).toJSON();
  return fromChainToBD(result.balance, wallet.decimals);
};

const getOnChainEVMTokenBalance = async (
  wallet: Wallet,
  chainApi: MoralisApi
): Promise<Decimal> => {
  const chain = wallet.chain ? getMoralisEvmChain(wallet.chain) : undefined;
  if (!chain || !wallet.walletAddress || !wallet.tokenAddress) {
    return Zero();
  }

  const address = EvmAddress.create(wallet.walletAddress);
  const tokenAddres = EvmAddress.create(wallet.tokenAddress);
  const result = (
    await chainApi.EvmApi.token.getWalletTokenBalances({
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
