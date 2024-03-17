"use client";
import { Entry, NormBN, WalletTokenInfo, Zero, infoKey } from "@/_common";
import { useCSVData } from "@/_hooks";
import BigNumber from "bignumber.js";
import { camelCase, findLast } from "lodash";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { parse } from "date-fns";

interface BlockpitData {
  blockpitId: string;
  timestamp: string;
  sourceType: string;
  sourceName: string;
  integration: string;
  transactionType: string;
  outgoingAsset: string;
  outgoingAmount: number;
  incomingAsset: string;
  incomingAmount: number;
  feeAsset: string;
  feeAmount: number;
  transactionId: string;
  note: string;
  mergeId: string;
}

type ServiceContextApi = {
  initialized: boolean;
  getEntries: (info: WalletTokenInfo) => Entry[];
  getBalance: (info: WalletTokenInfo) => BigNumber;
  transactions: BlockpitData[] | undefined;
};

const ServiceContext = createContext<ServiceContextApi>({
  initialized: false,
  getEntries: () => [],
  getBalance: () => Zero(),
  transactions: undefined,
});

type ServiceDataProviderProps = {
  historyFile: string;
  children: React.ReactNode;
};

const parseConfig = {
  dynamicTyping: true,
  transformHeader: camelCase,
};

export const ServiceDataProvider = ({
  historyFile,
  children,
}: ServiceDataProviderProps) => {
  // move to config by service
  const { data: transactions } = useCSVData<BlockpitData>({
    fileName: historyFile,
    parseConfig,
  });

  const [entryCache] = useState<Record<string, Entry[]>>({});

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
    <ServiceContext.Provider value={api}>{children}</ServiceContext.Provider>
  );
};

export const useServiceApi = (): ServiceContextApi =>
  useContext(ServiceContext);

const transform = (
  { type, name, symbol }: WalletTokenInfo,
  transactions: BlockpitData[]
): Entry[] =>
  transactions.reduce((accum, entry) => {
    if (entry.integration?.toLowerCase() !== name.toLowerCase()) {
      return accum;
    }

    if (
      symbol &&
      ![entry.incomingAsset, entry.outgoingAsset, entry.feeAsset].includes(
        symbol
      )
    ) {
      return accum;
    }

    const DateTime = parse(entry.timestamp, "dd.MM.yyyy HH:mm:ss", new Date());
    const DateString = DateTime.toLocaleDateString();

    const isNativeFeeByType =
      type == "native" &&
      !entry.feeAmount &&
      entry.transactionType === "Fee" &&
      entry.outgoingAsset === symbol;

    let Fee = Zero();
    if (isNativeFeeByType) {
      Fee = NormBN(entry.outgoingAmount || 0);
    } else if (type == "native") {
      Fee = NormBN(entry.feeAmount || 0);
    }

    const ignored = false;

    let Value = Zero();
    if (!isNativeFeeByType) {
      if (entry.outgoingAsset == symbol) {
        Value = NormBN(entry.outgoingAmount || 0).negated();
      } else if (entry.incomingAsset == symbol) {
        Value = NormBN(entry.incomingAmount || 0);
      }
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

    const Tx =
      entry.transactionId || extractHexadecimalString(entry.note) || "";

    const newEntry: Entry = {
      timestamp: DateTime.getTime(),
      Date: DateString,
      Time: DateTime.toLocaleTimeString(),
      Balance,
      ValuePerDay,
      FeePerDay,
      Value,
      Fee,
      Tx,
      Method: entry.transactionType,
      ignored,
      src: entry,
    };

    return [...accum, newEntry];
  }, [] as Entry[]);

function extractHexadecimalString(
  multilineString?: string
): string | undefined {
  const regex = /0x[0-9a-fA-F]{64}/; // Regular expression to match a 64-character hexadecimal string starting with '0x'
  const match = multilineString?.match(regex); // Attempt to find a match in the multiline string
  return match ? match[0] : undefined; // Return the first match if found, otherwise return undefined
}
