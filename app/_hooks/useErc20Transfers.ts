import { Chain, Entry, WalletTokenInfo, roundToDecimals } from "@/_common";
import {
  Erc20Transaction,
  Erc20TransactionData,
  EvmAddress,
  EvmChainish,
} from "@moralisweb3/common-evm-utils";
import { last } from "lodash";
import { useEffect, useMemo, useState } from "react";
import { Address, zeroAddress } from "viem";
import { MoralisApi, getMoralisChain, useMoralis } from "./useMoralis";

export interface useErc20TransfersProps {
  info?: WalletTokenInfo;
  enabled?: boolean;
}

const TransferMap = new Map<Chain, string>();

export const useErc20Transfers = ({
  info,
  enabled,
}: useErc20TransfersProps) => {
  const moralis = useMoralis();
  const [data, setData] = useState<Record<Address, Erc20Transaction[]>>({});

  useEffect(() => {
    if (enabled === false) return;

    const fetchErc20Transfers = async () => {
      const chain = getMoralisChain(info?.chain);
      if (!info || !moralis || !chain || !!data[info.walletAddress]) return;
      console.info("GO");

      const transactions = await getWalletTokenTransfers(
        moralis,
        info.walletAddress,
        chain
      );

      setData({ ...data, [info.walletAddress]: transactions });
    };

    fetchErc20Transfers();
  }, [moralis, data, enabled, info]);

  return useMemo(() => {
    if (!info) {
      return { data: [] };
    }

    const walletData = data[info.walletAddress];
    const entries = transform(
      walletData,
      EvmAddress.create(info.walletAddress),
      EvmAddress.create(info.address || zeroAddress)
    );

    return { data: entries };
  }, [data, info]);
};

async function getWalletTokenTransfers(
  moralis: MoralisApi,
  walletAddress: Address,
  chain: EvmChainish
): Promise<any[]> {
  const result: Erc20TransactionData[] = [];
  let cursor: string | undefined;

  do {
    const rawResponse = await moralis.EvmApi.token.getWalletTokenTransfers({
      address: walletAddress,
      chain: chain,
      cursor,
    });

    const response = rawResponse.toJSON();
    const entries = (response.result || []) as unknown as Erc20Transaction[];
    result.push(...entries);

    cursor = response.cursor;
  } while (cursor);

  return result;
}

const transform = (
  transfers: Erc20Transaction[],
  walletAddress: EvmAddress,
  tokenAddress: EvmAddress
): Entry<Erc20Transaction>[] =>
  (transfers || []).reduce((accum, transfer) => {
    if (transfer.address !== tokenAddress) {
      return accum;
    }

    const date = new Date(transfer.blockTimestamp);

    let Value = Number(transfer.value || 0);
    if (transfer.fromAddress == walletAddress) {
      Value = 0 - Value;
    }
    const Balance = roundToDecimals(Value);
    const previous = last(accum);
    const previousValuePerDay = previous?.ValuePerDay ?? 0;
    const ValuePerDay = roundToDecimals(previousValuePerDay + Value);

    const entry: Entry<Erc20Transaction> = {
      timestamp: date.getTime(),
      Date: date.toLocaleDateString(),
      Time: date.toLocaleTimeString(),
      Balance,
      FeePerDay: 0,
      ValuePerDay,
      Value,
      Fee: 0,
      Tx: transfer.transactionHash,
      Method: "transfer",
      src: transfer,
    };

    return [...accum, entry];
  }, [] as Entry<Erc20Transaction>[]);
