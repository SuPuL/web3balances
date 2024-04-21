import {
  ScannerTransformer,
  Chain,
  Entry,
  Transformer,
  ID,
  Wallet,
} from "@app/_common";
import { useMemo, useState } from "react";
import { useCSVDatas } from "./useCSVData";

export type ScanDataProp = Omit<Wallet, "name"> & {
  enabled?: boolean;
  publicHistoryFile: string;
  internalHistoryFile: string;
};

const Transformers: Partial<Record<Chain, Transformer>> = {
  BNB: new ScannerTransformer("Value_IN(BNB)", "Value_OUT(BNB)", "TxnFee(BNB)"),
  ETH: new ScannerTransformer("Value_IN(ETH)", "Value_OUT(ETH)", "TxnFee(ETH)"),
  MATIC: new ScannerTransformer(
    "Value_IN(MATIC)",
    "Value_OUT(MATIC)",
    "TxnFee(MATIC)"
  ),
};

export const useScanData = (
  configs: ScanDataProp[]
): Record<string, Entry<unknown>[]> => {
  const publicTransactions = useCSVDatas(
    configs.map(({ publicHistoryFile, enabled }) => ({
      fileName: publicHistoryFile,
      enabled,
    }))
  );
  const internalTransactions = useCSVDatas(
    configs.map(({ internalHistoryFile, enabled }) => ({
      fileName: internalHistoryFile,
      enabled,
    }))
  );

  const data = useMemo(
    () =>
      configs.reduce(
        (
          byAddress,
          {
            publicHistoryFile,
            internalHistoryFile,
            walletAddress,
            chain,
            chainId,
          }
        ) => {
          const pTrans = publicTransactions.data?.[publicHistoryFile];
          const iTrans = internalTransactions.data?.[internalHistoryFile];

          if (!walletAddress || !pTrans || !iTrans) return byAddress;

          return {
            ...byAddress,
            [chainId]:
              Transformers[chain]?.transform(walletAddress, pTrans, iTrans) ||
              [],
          };
        },
        {} as Record<string, Entry[]>
      ),
    [configs, internalTransactions.data, publicTransactions.data]
  );

  return useMemo(() => data, [data]);
};
