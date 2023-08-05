import { Entry, roundToDecimals } from "@/_common";
import { useMemo } from "react";
import { useCSVData } from "./useCSVData";
import { findLast } from "lodash";

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

export interface AccointingDataProps {
  walletName: string;
  historyFile: string;
  currencyFilter?: string;
}

const transform = (
  walletName: string,
  transactions: Transaction[],
  currencyFilter?: string
): Entry[] =>
  transactions.reduce((accum, entry, index) => {
    if (entry.walletName?.toLowerCase() !== walletName.toLowerCase()) {
      return accum;
    }

    if (
      currencyFilter &&
      ![entry.feeCurrency, entry.soldCurrency, entry.boughtCurrency].includes(
        currencyFilter
      )
    ) {
      return accum;
    }

    const DateTime = new Date(entry.timeExecuted);
    const DateString = DateTime.toLocaleDateString();
    const Fee = roundToDecimals(Number(entry.feeQuantity || 0));
    const ignored = entry.isIgnored === "TRUE";

    let Value = 0;
    if (entry.soldCurrency == currencyFilter) {
      Value = 0 - Number(entry.soldQuantity || 0);
    } else if (entry.boughtCurrency == currencyFilter) {
      Value = Number(entry.boughtQuantity || 0);
    }

    Value = roundToDecimals(Value);

    let Balance = Value - Fee;
    let FeePerDay = 0;
    let ValuePerDay = 0;

    if (!ignored) {
      const previous = findLast(accum, { ignored: false });

      let previousFeePerDay = previous?.FeePerDay ?? 0;
      let previousValuePerDay = previous?.ValuePerDay ?? 0;
      if (previous?.Date !== DateString) {
        previousFeePerDay = 0;
        previousValuePerDay = 0;
      }

      FeePerDay = roundToDecimals(previousFeePerDay + Fee);
      ValuePerDay = roundToDecimals(previousValuePerDay + Value);
      Balance = roundToDecimals((previous?.Balance ?? 0) + Value - Fee);
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

export const useAccointingData = ({
  walletName,
  historyFile,
  currencyFilter,
}: AccointingDataProps): { data: Entry[] | undefined } => {
  const { data: transactions } = useCSVData<Transaction>({
    fileName: historyFile,
  });

  const data = useMemo(() => {
    if (!walletName || !transactions) return;

    return transform(walletName, transactions, currencyFilter);
  }, [walletName, transactions, currencyFilter]);

  return useMemo(
    () => ({
      data,
    }),
    [data]
  );
};
