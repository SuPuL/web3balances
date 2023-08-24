"use client";
import {
  CompareEntry,
  ComponentProps,
  Entry,
  INACCUARCY,
  NormBN,
  WalletTokenInfo,
  safeDiff,
} from "@/_common";
import { useAccointingData, useErc20Transfers } from "@/_hooks";
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
  const { chainExplorerHistoryFile, chainExplorerInternalHistoryFile } =
    useConfig();
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
    }) || [];

  const transactions = useMemo(
    () => (selectedInfo?.type === "erc20" ? erc20Data : explorerEntries),
    [selectedInfo?.type, erc20Data, explorerEntries]
  );

  const comparedEntities: CompareEntry[] = useMemo(() => {
    if (!accointingEntries || !transactions) return [];

    const filtered = accointingEntries.filter(
      (entry) =>
        !(entry.ignored || (entry.Fee.isZero() && entry.Value.isZero()))
    );

    return transactions.map((entry) => {
      // accointing might have splitted the transaction into multiple entries. But only for native relevant (splitted NFTs mints etc.).
      // ERC20 are strictly 1:1
      const txs = _.chain(filtered).filter((e) => e.Tx === entry.Tx);
      // if (txs.size().value() > 1) {
      //   console.info("Foo", entry, txs.value());
      // }
      const lastTx = txs.last().value();

      const [CompBalance, DiffBalance] = safeDiffProps(
        entry,
        lastTx,
        "Balance"
      );
      const [CompValuePerDay, DiffValuePerDay] = safeDiffProps(
        entry,
        lastTx,
        "ValuePerDay"
      );
      const [CompFeePerDay, DiffFeePerDay] = safeDiffProps(
        entry,
        lastTx,
        "FeePerDay"
      );

      const CompFee = txs
        .reduce((accum, num) => accum.plus(NormBN(num.Fee)), BigNumber(0))
        .value();
      const DiffFee = safeDiff(entry.Fee, CompFee);

      const CompValue = txs
        .reduce((accum, num) => accum.plus(NormBN(num.Value)), BigNumber(0))
        .value();
      const DiffValue = safeDiff(entry.Value, CompValue);

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
  }, [accointingEntries, transactions]);

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

function safeDiffProps(
  entry: Entry,
  lastTx: Entry | undefined,
  prop: keyof Entry
) {
  let comp = (lastTx?.[prop] as BigNumber) || BigNumber(0);
  let diff = (entry[prop] as BigNumber).minus(comp);
  if (diff.abs().lte(INACCUARCY)) {
    comp = entry[prop] as BigNumber;
    diff = BigNumber(0);
  }

  return [comp, diff];
}
