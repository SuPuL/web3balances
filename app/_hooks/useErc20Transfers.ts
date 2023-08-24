import { BigDecimal, Entry, WalletTokenInfo } from "@/_common";
import {
  Erc20Transaction,
  Erc20TransactionData,
  EvmAddress,
  EvmChainish,
} from "@moralisweb3/common-evm-utils";
import { last } from "lodash";
import { useEffect, useMemo, useState } from "react";
import { Address, getAddress, zeroAddress } from "viem";
import {
  MoralisApi,
  getMoralisChain,
  useMoralis,
} from "../_provider/moralisProvider";
import _ from "lodash";
import { db } from "@/_db/db";

export interface useErc20TransfersProps {
  info?: WalletTokenInfo;
  enabled?: boolean;
}

export const useErc20Transfers = ({
  info,
  enabled,
}: useErc20TransfersProps) => {
  const { moralis } = useMoralis();
  const [data, setData] = useState<Record<Address, Erc20Transaction[]>>({});

  useEffect(() => {
    if (enabled === false) return;

    const fetchErc20Transfers = async () => {
      const mChain = getMoralisChain(info?.chain);
      if (!info || !moralis || !mChain || !!data[info.walletAddress]) return;

      let transactions = await db.erc20Transfers
        .filter(
          ({ address, chain }) =>
            address.checksum === info.walletAddress && chain === mChain
        )
        .toArray();

      if (!transactions.length) {
        transactions = await getWalletTokenTransfers(
          moralis,
          info.walletAddress,
          mChain
        );
        await db.erc20Transfers.bulkAdd(transactions);
      }

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
): Promise<Erc20TransactionData[]> {
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

const transform = (
  info: WalletTokenInfo,
  transfers: Erc20Transaction[]
): Entry<Erc20Transaction>[] => {
  const { decimals, walletAddress, tokenAddress } = info;
  const walletEvmAddress = EvmAddress.create(walletAddress);
  const tokenEvmAddress = EvmAddress.create(tokenAddress || zeroAddress);

  return _(transfers || [])
    .filter(({ contractAddress }) => tokenEvmAddress.equals(contractAddress))
    .sortBy("blockTimestamp")
    .reduce((accum, transfer) => {
      const date = new Date(transfer.blockTimestamp);
      const DateString = date.toLocaleDateString();

      let Value = BigDecimal(transfer.value.toString() || 0, decimals);
      if (transfer.fromAddress.equals(walletEvmAddress)) {
        Value = Value.negated();
      }

      const previous = last(accum);
      const Balance = previous?.Balance.plus(Value) || Value;
      let previousValuePerDay =
        previous?.ValuePerDay ?? BigDecimal(0, decimals);
      if (previous?.Date !== DateString) {
        previousValuePerDay = BigDecimal(0, decimals);
      }
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
        Method: Value.gte(0) ? "deposit" : "withdraw",
        src: transfer,
      };

      // merge duplicates
      if (previous?.Tx === transfer.transactionHash) {
        previous.Value = previous.Value.plus(Value);
        previous.Balance = previous.Balance.plus(Value);
        previous.ValuePerDay = previous.ValuePerDay.plus(Value);

        return accum;
      }

      return [...accum, entry];
    }, [] as Entry<Erc20Transaction>[]);
};
