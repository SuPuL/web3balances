"use client";
import {
  CompareEntry,
  ComponentProps,
  Entry,
  WalletTokenInfo,
} from "@/_common";
import { useErc20Transfers } from "@/_hooks";
import { useAccointingData } from "@/_hooks/useAccointingData";
import { useScanData } from "@/_hooks/useScanData";
import { useConfig } from "@/_provider/configProvider";
import { useWalletTokenInfoProvider } from "@/_provider/walletTokenInfoProvider";
import BigNumber from "bignumber.js";
import _, { findLast, last } from "lodash";
import { createContext, useContext, useMemo } from "react";

export interface BalanceApi {
  selectedInfo?: WalletTokenInfo;
  transactions?: Entry[];
  transactionBalance: BigNumber;
  accointingEntries?: Entry[];
  accointingBalance: BigNumber;
  comparedEntities?: CompareEntry[];
  comparedBalance?: BigNumber;
}

const BalanceContext = createContext<BalanceApi>({
  selectedInfo: undefined,
  transactions: undefined,
  transactionBalance: BigNumber(0),
  accointingEntries: undefined,
  accointingBalance: BigNumber(0),
});

const getFilePath = (info: WalletTokenInfo | undefined, file: string): string =>
  info ? [info?.walletAddress, `${info.symbol}_${file}`].join("/") : "";

export const BalanceProvider = ({ children }: ComponentProps) => {
  const {
    chainExplorerHistoryFile,
    chainExplorerInternalHistoryFile,
    accointingInternalHistoryFile,
  } = useConfig();
  const { selectedInfo } = useWalletTokenInfoProvider();

  const { data: explorerEntries } =
    useScanData({
      address: selectedInfo?.walletAddress || "",
      publicHistoryFile: getFilePath(selectedInfo, chainExplorerHistoryFile),
      internalHistoryFile: getFilePath(
        selectedInfo,
        chainExplorerInternalHistoryFile
      ),
      enabled: selectedInfo?.type === "native",
    }) || [];

  const { data: erc20Data } = useErc20Transfers({
    info: selectedInfo,
    enabled: selectedInfo?.type === "erc20",
  });

  const { data: accointingEntries } =
    useAccointingData({
      info: selectedInfo,
      historyFile: accointingInternalHistoryFile,
    }) || [];

  const transactions = useMemo(
    () => (selectedInfo?.type === "erc20" ? erc20Data : explorerEntries),
    [selectedInfo?.type, erc20Data, explorerEntries]
  );

  const comparedEntities: CompareEntry[] = useMemo(() => {
    if (!explorerEntries || !transactions) return [];

    const filtered = transactions.filter(
      (entry) =>
        !(entry.ignored || (entry.Fee.isZero() && entry.Value.isZero()))
    );

    return explorerEntries.map((entry) => {
      // accointing might have splitted the transaction into multiple entries
      const txs = _.chain(filtered).filter((e) => e.Tx === entry.Tx);
      const lastTx = txs.last().value();

      const CompBalance = lastTx?.Balance || BigNumber(0);
      const DiffBalance = entry.Balance.minus(CompBalance);

      const CompValuePerDay = lastTx?.ValuePerDay || BigNumber(0);
      const DiffValuePerDay = entry.ValuePerDay.minus(CompValuePerDay);

      const CompFeePerDay = lastTx?.FeePerDay || BigNumber(0);
      const DiffFeePerDay = entry.FeePerDay.minus(CompFeePerDay);

      const CompFee = txs
        .reduce((accum, num) => accum.plus(num.Fee), BigNumber(0))
        .value();
      const DiffFee = entry.Fee.minus(CompFee);
      const CompValue = txs
        .reduce((accum, num) => accum.plus(num.Value), BigNumber(0))
        .value();
      const DiffValue = entry.Value.minus(CompValue);

      return {
        ...entry,
        CompBalance,
        DiffBalance,
        CompValuePerDay,
        DiffValuePerDay,
        CompFeePerDay,
        DiffFeePerDay,
        CompFee,
        DiffFee,
        CompValue,
        DiffValue,
        Compare: txs.value(),
      };
    });
  }, [explorerEntries, transactions]);

  const api: BalanceApi = useMemo(() => {
    let transactionBalance = last(transactions)?.Balance || BigNumber(0);
    let accointingBalance =
      findLast(accointingEntries, { ignored: false })?.Balance || BigNumber(0);

    return {
      selectedInfo,
      transactions,
      transactionBalance,
      accointingEntries,
      accointingBalance,
      comparedEntities,
      comparedBalance: transactionBalance.minus(accointingBalance),
    };
  }, [accointingEntries, comparedEntities, selectedInfo, transactions]);

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

function safeDiff(entry: Entry, lastTx: Entry | undefined, prop: keyof Entry) {
  let comp = (lastTx?.[prop] as number) || 0;
  let diff = (entry[prop] as number) - comp;
  if (diff < 0.0000001) {
    comp = entry[prop] as number;
    diff = 0;
  }
  return [comp, diff];
}
