"use client";
import { ComponentProps } from "@app/_common";
import { BalanceData, useBalanceData } from "@app/_hooks/useBalanceData";
import { useWalletTokenInfoProvider } from "@app/_provider/walletsProvider";
import BigNumber from "bignumber.js";
import { createContext, useContext } from "react";
import { useConfig } from "./configProvider";

export type BalanceApi = BalanceData;

const BalanceContext = createContext<BalanceApi>({
  selectedInfo: undefined,
  transactions: undefined,
  transactionBalance: BigNumber(0),
  serviceEntries: undefined,
  serviceBalance: BigNumber(0),
});

export const BalanceProvider = ({ children }: ComponentProps) => {
  const config = useConfig();
  const { selectedInfo: info } = useWalletTokenInfoProvider();

  const api = useBalanceData({ info, ...config });

  return (
    <BalanceContext.Provider value={api}>{children}</BalanceContext.Provider>
  );
};

export function useBalances() {
  const balanceApi = useContext(BalanceContext);

  if (!balanceApi) {
    throw new Error("use-balance must be used within a BalanceProvider");
  }

  return balanceApi;
}
