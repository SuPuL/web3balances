"use client";
import { Entry, NormBN, WalletTokenInfo, Zero, infoKey } from "@/_common";
import { useCSVData } from "@/_hooks";
import BigNumber from "bignumber.js";
import { findLast, last } from "lodash";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface Transaction {
  timeExecuted: string;
  type: string;
  boughtQuantity: string;
  boughtCurrency: string;
  boughtCurrencyId: string;
  soldQuantity: string;
  soldCurrency: string;
  soldCurrencyId: string;
  feeQuantity: string;
  feeCurrency: string;
  feeCurrencyId: string;
  classification: string;
  walletName: string;
  walletProvider: string;
  txId: string;
  primaryAddress: string;
  otherAddress: string;
  temporaryCurrencyName: string;
  temporaryFeeCurrencyName: string;
  temporaryBoughtCurrencyTicker: string;
  temporarySoldCurrencyTicker: string;
  temporaryFeeCurrencyTicker: string;
  id: string;
  associatedTransferId: string;
  comments: string;
  fiatValueOverwrite: string;
  feeFiatValueOverwrite: string;
  isIgnored: string;
}

type AccointingContextApi = {
  initialized: boolean;
  getEntries: (info: WalletTokenInfo) => Entry[];
  getBalance: (info: WalletTokenInfo) => BigNumber;
  transactions: Transaction[] | undefined;
};

const AccointingContext = createContext<AccointingContextApi>({
  initialized: false,
  getEntries: () => [],
  getBalance: () => Zero(),
  transactions: undefined,
});

type AccointingDataProviderProps = {
  historyFile: string;
  children: React.ReactNode;
};

export const AccointingDataProvider = ({
  historyFile,
  children,
}: AccointingDataProviderProps) => {
  const { data: transactions } = useCSVData<Transaction>({
    fileName: historyFile,
  });

  const [entryCache, setEntryCache] = useState<Record<string, Entry[]>>({});

  const getEntries = useCallback(
    (info: WalletTokenInfo) => {
      if (!transactions) return [];

      const key = infoKey(info);
      if (!entryCache[key]) {
        entryCache[key] = transform(info, transactions);
      }

      return entryCache[key];
    },
    [transactions, entryCache]
  );

  const getBalance = useCallback(
    (info: WalletTokenInfo) => {
      const entries = getEntries(info);
      const last = findLast(entries, { ignored: false });
      return last?.Balance ?? Zero();
    },
    [getEntries]
  );

  const api = useMemo(() => {
    return {
      transactions,
      initialized: !!transactions,
      getEntries,
      getBalance,
    };
  }, [transactions, getEntries, getBalance]);

  return (
    <AccointingContext.Provider value={api}>
      {children}
    </AccointingContext.Provider>
  );
};

export const useAccointingApi = (): AccointingContextApi =>
  useContext(AccointingContext);

const transform = (
  { type, name, symbol }: WalletTokenInfo,
  transactions: Transaction[]
): Entry[] =>
  transactions.reduce((accum, entry) => {
    if (entry.walletName?.toLowerCase() !== name.toLowerCase()) {
      return accum;
    }

    if (
      symbol &&
      ![entry.feeCurrency, entry.soldCurrency, entry.boughtCurrency].includes(
        symbol
      )
    ) {
      return accum;
    }

    const DateTime = new Date(entry.timeExecuted);
    const DateString = DateTime.toLocaleDateString();
    const Fee = type == "native" ? NormBN(entry.feeQuantity) : Zero();
    const ignored = entry.isIgnored === "TRUE";

    let Value = Zero();
    if (entry.soldCurrency == symbol) {
      Value = NormBN(entry.soldQuantity).negated();
    } else if (entry.boughtCurrency == symbol) {
      Value = NormBN(entry.boughtQuantity);
    }

    let Balance = Value.minus(Fee);
    let FeePerDay = Zero();
    let ValuePerDay = Zero();

    const previous = findLast(accum, { ignored: false });
    if (!ignored) {
      let previousFeePerDay = previous?.FeePerDay ?? Zero();
      let previousValuePerDay = previous?.ValuePerDay ?? Zero();
      if (previous?.Date !== DateString) {
        previousFeePerDay = Zero();
        previousValuePerDay = Zero();
      }

      FeePerDay = type == "native" ? previousFeePerDay.plus(Fee) : Zero();
      ValuePerDay = previousValuePerDay.plus(Value);
      Balance = (previous?.Balance || Zero()).plus(Value).minus(Fee);
    }

    const newEntry: Entry = {
      timestamp: DateTime.getTime(),
      Date: DateString,
      Time: DateTime.toLocaleTimeString(),
      Balance,
      ValuePerDay,
      FeePerDay,
      Value,
      Fee,
      Tx: entry.txId,
      Method: entry.type,
      ignored,
      src: entry,
    };

    return [...accum, newEntry];
  }, [] as Entry[]);
