import { ScannerTransformer, Chain, Entry, Transformer } from "@/_common";
import { useMemo } from "react";
import { useCSVData } from "./useCSVData";

export interface ScanDataProps {
  chain: Chain;
  address: string;
  publicHistoryFile: string;
  internalHistoryFile: string;
  enabled?: boolean;
}

const Transformers: Partial<Record<Chain, Transformer>> = {
  BNB: new ScannerTransformer("Value_IN(BNB)", "Value_OUT(BNB)", "TxnFee(BNB)"),
  ETH: new ScannerTransformer("Value_IN(ETH)", "Value_OUT(ETH)", "TxnFee(ETH)"),
  MATIC: new ScannerTransformer(
    "Value_IN(MATIC)",
    "Value_OUT(MATIC)",
    "TxnFee(MATIC)"
  ),
};

export const useScanData = ({
  chain,
  address,
  publicHistoryFile,
  internalHistoryFile,
  enabled,
}: ScanDataProps): { data: Entry[] | undefined } => {
  const { data: publicTransactions } = useCSVData({
    fileName: publicHistoryFile,
    enabled,
  });
  const { data: internalTransactions } = useCSVData({
    fileName: internalHistoryFile,
    enabled,
  });

  const data = useMemo(() => {
    if (!address || !publicTransactions || !internalTransactions) return;

    return (
      Transformers[chain]?.transform(
        address,
        publicTransactions,
        internalTransactions
      ) || []
    );
  }, [address, chain, internalTransactions, publicTransactions]);

  return useMemo(
    () => ({
      data,
    }),
    [data]
  );
};
