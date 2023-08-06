"use client";
import {
  CompareEntry,
  ComponentProps,
  Entry,
  Wallet,
  WalletTokenInfo,
  roundToDecimals,
  roundedDiff,
} from "@/_common";
import { useAccointingData } from "@/_hooks/useAccointingData";
import { useScanData as useScanData } from "@/_hooks/useScanData";
import _, { findLast, last } from "lodash";
import { createContext, useContext, useMemo } from "react";
import { useConfig } from "@/_provider/configProvider";
import { useWalletTokenInfoProvider } from "@/_provider/walletTokenInfoProvider";
import { useErc20Transfers } from "@/_hooks";

export interface BalanceApi {
  selectedInfo?: WalletTokenInfo;
  explorerEntries?: Entry[];
  explorerBalance: number;
  accointingEntries?: Entry[];
  accointingBalance: number;
  comparedEntities?: CompareEntry[];
  comparedBalance?: number;
}

const BalanceContext = createContext<BalanceApi>({
  selectedInfo: undefined,
  explorerEntries: undefined,
  explorerBalance: 0,
  accointingEntries: undefined,
  accointingBalance: 0,
});

const getFilePath = (info: WalletTokenInfo | undefined, file: string): string =>
  info ? [info?.walletAddress, `${info.currency}_${file}`].join("/") : "";

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

  console.info(selectedInfo);

  const { data: erc20Data } = useErc20Transfers({
    info: selectedInfo,
    enabled: selectedInfo?.type === "erc20",
  });

  const { data: accointingEntries } =
    useAccointingData({
      walletName: selectedInfo?.name || "",
      historyFile: accointingInternalHistoryFile,
      currencyFilter: selectedInfo?.currency,
    }) || [];

  const comparedEntities: CompareEntry[] = useMemo(() => {
    if (!explorerEntries || !accointingEntries) return [];

    const filtered = accointingEntries.filter(
      (entry) => !(entry.ignored || (entry.Fee === 0 && entry.Value == 0))
    );

    return explorerEntries.map((entry) => {
      // accointing might have splitted the transaction into multiple entries
      const txs = _.chain(filtered).filter((e) => e.Tx === entry.Tx);
      const lastTx = txs.last().value();

      const [CompBalance, DiffBalance] = safeDiff(entry, lastTx, "Balance");
      const [CompValuePerDay, DiffValuePerDay] = safeDiff(
        entry,
        lastTx,
        "ValuePerDay"
      );
      const [CompFeePerDay, DiffFeePerDay] = safeDiff(
        entry,
        lastTx,
        "FeePerDay"
      );

      const CompFee = roundToDecimals(txs.sumBy("Fee").defaultTo(0).value());
      const DiffFee = roundedDiff(entry.Fee, CompFee);
      const CompValue = roundToDecimals(
        txs.sumBy("Value").defaultTo(0).value()
      );
      const DiffValue = roundedDiff(entry.Value, CompValue);

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
  }, [explorerEntries, accointingEntries]);

  const api: BalanceApi = useMemo(() => {
    let explorerBalance = last(explorerEntries)?.Balance || 0;
    let accointingBalance =
      findLast(accointingEntries, { ignored: false })?.Balance || 0;

    return {
      selectedInfo,
      explorerEntries,
      explorerBalance,
      accointingEntries,
      accointingBalance,
      comparedEntities,
      comparedBalance: explorerBalance - accointingBalance,
    };
  }, [explorerEntries, accointingEntries, comparedEntities, selectedInfo]);

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
