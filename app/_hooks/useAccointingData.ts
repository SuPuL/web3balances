import { Entry, NormBN, WalletTokenInfo, Zero } from "@/_common";
import { useMemo } from "react";
import { useCSVData } from "./useCSVData";
import { findLast } from "lodash";
import BigNumber from "bignumber.js";

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
  info?: WalletTokenInfo;
  historyFile: string;
}

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

export const useAccointingData = ({
  info,
  historyFile,
}: AccointingDataProps): { data: Entry[] | undefined } => {
  const { data: transactions } = useCSVData<Transaction>({
    fileName: historyFile,
  });

  const data = useMemo(() => {
    if (!info || !transactions) return;

    return transform(info, transactions);
  }, [info, transactions]);

  return useMemo(
    () => ({
      data,
    }),
    [data]
  );
};
