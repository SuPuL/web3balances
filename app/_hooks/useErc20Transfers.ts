import { Chain, Entry, WalletTokenInfo } from "@/_common";
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
import BigNumber from "bignumber.js";
import _ from "lodash";

export interface useErc20TransfersProps {
  info?: WalletTokenInfo;
  enabled?: boolean;
}

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
    if (!info?.tokenAddress) {
      return { data: [] };
    }

    const tokenAddress = EvmAddress.create(info.tokenAddress);
    const transactions = data[info.walletAddress] || [];
    const entries = transform(info, transactions);

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

  let response = await moralis.EvmApi.token.getWalletTokenTransfers({
    address: walletAddress,
    chain: chain,
    cursor,
  });

  result.push(...response.result);

  while (response.hasNext()) {
    response = await response.next();
    result.push(...response.result);
  }

  return result;
}

const BigDecimal = (value: BigNumber.Value, decimals: number) =>
  BigNumber(value).shiftedBy(-decimals);

const transform = (
  info: WalletTokenInfo,
  transfers: Erc20Transaction[]
): Entry<Erc20Transaction>[] => {
  const { decimals, walletAddress } = info;
  const walletEvmAddress = EvmAddress.create(info.walletAddress);
  const tokenEvmAddress = EvmAddress.create(info.tokenAddress || zeroAddress);

  return _(transfers || [])
    .filter(({ contractAddress }) => tokenEvmAddress.equals(contractAddress))
    .sortBy("blockTimestamp")
    .reduce((accum, transfer) => {
      const date = new Date(transfer.blockTimestamp);

      let Value = BigDecimal(transfer.value.toString() || 0, decimals);
      if (transfer.fromAddress.equals(walletEvmAddress)) {
        Value = Value.negated();
      }

      const previous = last(accum);
      const Balance = previous?.Balance.plus(Value) || Value;
      const previousValuePerDay =
        previous?.ValuePerDay ?? BigDecimal(0, decimals);
      const ValuePerDay = previousValuePerDay.plus(Value);

      const entry: Entry<Erc20Transaction> = {
        timestamp: date.getTime(),
        Date: date.toLocaleDateString(),
        Time: date.toLocaleTimeString(),
        Balance,
        FeePerDay: BigDecimal(0, decimals),
        ValuePerDay,
        Value,
        Fee: BigDecimal(0, decimals),
        Tx: transfer.transactionHash,
        Method: "transfer",
        src: transfer,
      };

      return [...accum, entry];
    }, [] as Entry<Erc20Transaction>[]);
};
