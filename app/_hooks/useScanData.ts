import { Entry, NormBN, Zero } from "@/_common";
import BigNumber from "bignumber.js";
import { useMemo } from "react";
import { useCSVData } from "./useCSVData";

interface BaseTransaction {
  Blockno: string;
  ContractAddress: string;
  CurrentValue: string;
  DateTime: string;
  ErrCode: string;
  From: string;
  Status: string;
  Txhash: string;
  UnixTimestamp: string;
  __parsed_extra: string[];
  "Value_IN(BNB)": string;
  "Value_OUT(BNB)": string;
}

interface Transaction extends BaseTransaction {
  Historical: string;
  Method: string;
  To: string;
  "TxnFee(BNB)": string;
  "TxnFee(USD)": string;
}

interface InternalTransaction extends BaseTransaction {
  HistoricalPrice: string;
  ParentTxBNBValue: string;
  ParentTxFrom: string;
  ParentTxTo: string;
  Type: string;
}

export interface BNBDataProps {
  address: string;
  publicHistoryFile: string;
  internalHistoryFile: string;
  enabled?: boolean;
}

const transform = (address: string, transactions: BaseTransaction[]): Entry[] =>
  transactions.reduce((accum, entry, index) => {
    if (!entry.From) {
      return accum;
    }

    const DateTime = new Date(Number(entry.UnixTimestamp) * 1000);
    const DateString = DateTime.toLocaleDateString();

    const Value = NormBN(entry["Value_IN(BNB)"]).minus(
      NormBN(entry["Value_OUT(BNB)"])
    );

    const Fee =
      entry.From?.toLowerCase() === address.toLowerCase() &&
      "TxnFee(BNB)" in entry
        ? NormBN(Number(entry?.["TxnFee(BNB)"]))
        : Zero();

    const Balance = NormBN(accum[index - 1]?.Balance)
      .plus(Value)
      .minus(Fee);

    const previous = accum[index - 1];
    let previousFeePerDay = NormBN(previous?.FeePerDay);
    let previousValuePerDay = NormBN(previous?.ValuePerDay);
    if (previous?.Date !== DateString) {
      previousFeePerDay = Zero();
      previousValuePerDay = Zero();
    }

    const FeePerDay = previousFeePerDay.plus(Fee);
    const ValuePerDay = previousValuePerDay.plus(Value);

    const methodProp = (
      "Method" in entry ? "Method" : "Type"
    ) as keyof BaseTransaction;
    const Method = entry[methodProp] as string;

    const newEntry: Entry = {
      timestamp: DateTime.getTime(),
      Date: DateString,
      Time: DateTime.toLocaleTimeString(),
      Balance,
      ValuePerDay,
      FeePerDay,
      Value,
      Fee,
      Tx: entry.Txhash,
      Method,
      src: entry,
    };

    return [...accum, newEntry];
  }, [] as Entry[]);

const mergeInternalAndPublic = (
  transactions: Transaction[],
  internals: InternalTransaction[]
): InternalTransaction[] => {
  // Check each internal transaction if it is already in the public transactions. If so, we merge them.
  // And return all not merged.
  const notMergedInternals: InternalTransaction[] = [];
  internals.forEach((internal) => {
    const tx = transactions.find((tx) => tx.Txhash === internal.Txhash);
    if (tx) {
      tx["Value_IN(BNB)"] += internal["Value_IN(BNB)"];
      tx["Value_OUT(BNB)"] += internal["Value_OUT(BNB)"];
    } else {
      notMergedInternals.push(internal);
    }
  });

  return notMergedInternals;
};

export const useScanData = ({
  address,
  publicHistoryFile,
  internalHistoryFile,
  enabled,
}: BNBDataProps): { data: Entry[] | undefined } => {
  const { data: publicTransactions } = useCSVData<Transaction>({
    fileName: publicHistoryFile,
    enabled,
  });
  const { data: internalTransactions } = useCSVData<InternalTransaction>({
    fileName: internalHistoryFile,
    enabled,
  });

  const data = useMemo(() => {
    if (!address || !publicTransactions || !internalTransactions) return;

    const publicTxs = publicTransactions.filter((t) => t.Txhash);
    const internalTxs = internalTransactions.filter((t) => t.Txhash);

    // now merge all already known transactions. Relevant for swaps. For some internal there are non on bnb scan so we attach the rest.
    const notMergedInternal = mergeInternalAndPublic(publicTxs, internalTxs);

    const transactions = [...publicTxs, ...notMergedInternal].sort(
      (a, b) => Number(a.UnixTimestamp) * 1000 - Number(b.UnixTimestamp) * 1000
    );

    console.info("transactions", transactions);

    return transform(address, transactions);
  }, [address, internalTransactions, publicTransactions]);

  return useMemo(
    () => ({
      data,
    }),
    [data]
  );
};
