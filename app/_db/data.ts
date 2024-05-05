import { Chain, Entry, WalletTokenInfo } from "@app/_common/types";
import { EntryType, TokenInfoType, Wallet } from "@prisma/client";
import { first } from "lodash";
import { cache } from "react";
import prisma from "./prisma";

const toWalletTokenInfo = (wallet: Wallet): WalletTokenInfo => ({
  ...wallet,
  chain: wallet.chain as Chain,
  type: wallet.type === TokenInfoType.NATIVE ? "NATIVE" : "ERC20",
  tokenAddress: wallet.tokenAddress || undefined,
  walletAddress: wallet.walletAddress || "",
});

export const getWallet = async (
  walletId: number
): Promise<WalletTokenInfo | undefined> =>
  (await getWallets()).find((wallet) => wallet.id == walletId);

export const getWalletOrFirst = async (
  walletId: number | undefined
): Promise<WalletTokenInfo | undefined> => {
  const wallet = walletId ? getWallet(walletId) : undefined;

  return wallet || first(await getWallets());
};

export const getWallets = cache(async (): Promise<WalletTokenInfo[]> => {
  const wallets = await prisma.wallet.findMany();

  return wallets.map(toWalletTokenInfo);
});

export const markWalletChecked = async (
  id: number,
  checked: boolean
): Promise<void> => {
  await prisma.wallet.update({
    where: {
      id,
    },
    data: {
      checked,
    },
  });
};

export const getEntries = async (
  walletId: number,
  type: EntryType
): Promise<Entry[]> => {
  const entries = await prisma.entry.findMany({
    where: {
      walletId,
      type,
    },
    orderBy: {
      date: "asc",
    },
  });

  return entries.map((entry) => ({
    ...entry,
  }));
};

export const getCompareEntries = async (
  walletId: number,
  type: EntryType
): Promise<Entry[]> => {
  const entries = await prisma.entryComparison.findMany({
    where: {
      walletId,
      type,
    },
    orderBy: {
      date: "asc",
    },
  });

  return entries.map((entry) => ({
    ...entry,
  }));
};
