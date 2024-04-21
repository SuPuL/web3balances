"use client";
import { CompareEntry, Entry, WalletTokenInfo } from "@app/_common";
import { INACCUARCY } from "@app/_common/utils";
import { useServiceData, useErc20Transfers } from "@app/_hooks";
import { useScanData } from "@app/_hooks/useScanData";
import { NormBN, Zero, safeDiff } from "@lib/bigNumber";
import BigNumber from "bignumber.js";
import _, { findLast, last } from "lodash";
import { useMemo } from "react";

const getFilePath = (
  info: Record<string, any> | undefined,
  file: string
): string | undefined => {
  if (!info) return undefined;

  return file
    .replace(/{(.*?)}/g, (_, key) => info[key.trim()] || "")
    .toLowerCase();
};

export interface BalanceData {
  selectedInfo?: WalletTokenInfo;
  transactions?: Entry[];
  transactionBalance: BigNumber;
  serviceEntries?: Entry[];
  serviceBalance: BigNumber;
  comparedEntities?: CompareEntry[];
  comparedEntitiesInvalid?: CompareEntry[];
  comparedBalance?: BigNumber;
}

export interface BalanceDataProps {
  info?: WalletTokenInfo;
  chainExplorerHistoryFile: string;
  chainExplorerInternalHistoryFile: string;
}

export const useBalanceData = (props: BalanceDataProps): BalanceData => {
  const data = useBalanceDatas([props]);

  return useMemo(
    () => data?.[0] || { transactionBalance: Zero(), serviceBalance: Zero() },
    [data]
  );
};

export const useBalanceDatas = (props: BalanceDataProps[]): BalanceData[] => {
  const scannerConfigs = useMemo(
    () =>
      props.map(
        ({
          chainExplorerHistoryFile,
          chainExplorerInternalHistoryFile,
          info,
        }) => {
          const files = info
            ? {
                publicHistoryFile: getFilePath(info, chainExplorerHistoryFile),
                internalHistoryFile: getFilePath(
                  info,
                  chainExplorerInternalHistoryFile
                ),
              }
            : undefined;

          return {
            chainId: info?.chainId || "",
            chain: info?.chain || "ETH",
            walletAddress: info?.walletAddress || "0x00",
            enabled: !!info?.chain && info?.type === "native" && !!files,
            publicHistoryFile: "",
            internalHistoryFile: "",
            ...files,
          };
        }
      ),
    [props]
  );
  const explorerEntries = useScanData(scannerConfigs);

  const infoConfigs = useMemo(
    () =>
      props.map(({ info }) => ({
        info: info,
        enabled: info?.type === "erc20",
      })),
    [props]
  );
  const erc20Datas = useErc20Transfers(infoConfigs);
  const serviceDatas = useServiceData(infoConfigs);

  const transactionDatas = useMemo(
    () =>
      infoConfigs.reduce((data, { info }) => {
        if (!info) return data;

        return {
          ...data,
          [info.chainId]:
            info.type === "erc20"
              ? erc20Datas[info.chainId]
              : explorerEntries[info.chainId],
        };
      }, {} as Record<string, Entry[]>),
    [erc20Datas, explorerEntries, infoConfigs]
  );

  const comparedEntitiesData = useMemo(
    () =>
      infoConfigs.reduce(
        (data, { info }) => {
          if (!info) return data;

          const serviceEntries = serviceDatas?.[info.chainId];
          const transactions = transactionDatas?.[info.chainId];
          if (!serviceEntries || !transactions) return data;

          const filtered = serviceEntries.filter(
            (entry) =>
              !(entry.ignored || (entry.Fee.isZero() && entry.Value.isZero()))
          );

          const comparedEntities = transactions.map((entry) => {
            // blockpit might have splitted the transaction into multiple entries. But only for native relevant (splitted NFTs mints etc.).
            // ERC20 are strictly 1:1
            const txs = _.chain(filtered).filter((e) => e.Tx === entry.Tx);
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
              .reduce(
                (accum, num) => accum.plus(NormBN(num.Value)),
                BigNumber(0)
              )
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

          const comparedEntitiesInvalid = comparedEntities?.filter(
            (entry) =>
              !(
                entry.DiffBalance.isZero() &&
                entry.DiffValue.isZero() &&
                entry.DiffFee.isZero()
              )
          );

          return {
            ...data,
            [info.chainId]: {
              comparedEntities,
              comparedEntitiesInvalid,
            },
          };
        },
        {} as Record<
          string,
          {
            comparedEntities: CompareEntry[];
            comparedEntitiesInvalid: CompareEntry[];
          }
        >
      ),
    [infoConfigs, serviceDatas, transactionDatas]
  );

  return useMemo(
    () =>
      infoConfigs.reduce((accum, { info }) => {
        if (!info) return accum;

        const transactions = transactionDatas?.[info.chainId];
        const serviceEntries = serviceDatas?.[info.chainId];
        const compareData = comparedEntitiesData?.[info.chainId];

        let transactionBalance = last(transactions)?.Balance || BigNumber(0);
        let serviceBalance =
          findLast(serviceEntries, { ignored: false })?.Balance || BigNumber(0);

        const balanceData = {
          selectedInfo: info,
          transactions,
          transactionBalance,
          serviceEntries,
          serviceBalance,
          comparedBalance: transactionBalance.minus(serviceBalance),
          ...compareData,
        };

        return [...accum, balanceData];
      }, [] as BalanceData[]),
    [serviceDatas, comparedEntitiesData, infoConfigs, transactionDatas]
  );
};

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
