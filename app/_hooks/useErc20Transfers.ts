import { BigDecimal, Entry, WalletTokenInfo } from "@/_common";
import {
  Erc20Burn,
  Erc20Transaction,
  Erc20TransactionInput,
  EvmAddress,
  EvmChainish,
} from "@moralisweb3/common-evm-utils";
import _, { last } from "lodash";
import { useEffect, useMemo, useState } from "react";
import { Address, zeroAddress } from "viem";
import {
  MoralisApi,
  getMoralisChain,
  useMoralis,
} from "../_provider/moralisProvider";

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
  const [data, setData] = useState<Record<string, Erc20TransactionInput[]>>({});

  useEffect(() => {
    if (enabled === false) return;

    const fetchErc20Transfers = async () => {
      const mChain = getMoralisChain(info?.chain);
      const id = `${info?.walletAddress}-${info?.chain}`;
      if (!info || !moralis || !mChain || data[id]) return;

      let count = await db.erc20Transfers.where({ chain: mChain.hex }).count();
      if (!count) {
        const allTransactions = await getWalletTokenTransfers(
          moralis,
          info.walletAddress,
          mChain
        );
        await db.erc20Transfers.bulkAdd(allTransactions);
      }

      const transactions = await db.erc20Transfers
        .filter(
          ({ toAddress, fromAddress, chain }) =>
            [
              toAddress.toString().toLowerCase(),
              fromAddress.toString().toLowerCase(),
            ].includes(info.walletAddress?.toLowerCase()) &&
            mChain.equals(chain)
        )
        .toArray();

      setData({ ...data, [id]: transactions });
    };

    fetchErc20Transfers();
  }, [moralis, data, enabled, info]);

  return useMemo(() => {
    if (!info?.tokenAddress) {
      return { data: [] };
    }
    const id = `${info?.walletAddress}-${info.chain}`;
    const transactions = data[id] || [];
    const entries = transform(info, transactions);

    return { data: entries };
  }, [data, info]);
};

const mapBurns = (burns: Erc20Burn[]): Erc20TransactionInput[] =>
  burns
    .map((burn) => burn.toJSON())
    .map((burn) => ({
      ...burn,
      address: burn.contractAddress,
      toAddress: zeroAddress,
      fromAddress: burn.fromWallet,
      possibleSpam: false,
    }));

async function getWalletTokenTransfers(
  moralis: MoralisApi,
  walletAddress: Address,
  chain: EvmChainish
): Promise<Erc20TransactionInput[]> {
  const result = await getERCTransfersForAccount(moralis, walletAddress, chain);
  const burns = _(result)
    .filter(({ toAddress }) => toAddress == zeroAddress)
    .uniq()
    .value();

  let cursor: string | undefined;

  // let response = await moralis.EvmApi.token.getErc20Burns({
  //   chain: chain,
  //   contractAddresses,
  //   walletAddresses: [walletAddress],
  //   cursor,
  // });

  // result.push(...mapBurns(response.result));

  // while (response.hasNext()) {
  //   response = await response.next();
  //   result.push(...mapBurns(response.result));
  // }

  return result;
}

async function getERCTransfersForAccount(
  moralis: MoralisApi,
  walletAddress: Address,
  chain: EvmChainish
): Promise<Erc20TransactionInput[]> {
  const result: Erc20Transaction[] = [];
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

  return result.map((tx) => tx.toJSON());
}

const transform = (
  info: WalletTokenInfo,
  transfers: Erc20TransactionInput[]
): Entry<Erc20TransactionInput>[] => {
  const { decimals, walletAddress, tokenAddress } = info;
  const walletEvmAddress = EvmAddress.create(walletAddress);
  const tokenEvmAddress = EvmAddress.create(tokenAddress || zeroAddress);

  return _(transfers || [])
    .filter(({ address }) => tokenEvmAddress.equals(address))
    .sortBy("blockTimestamp")
    .reduce((accum, transfer) => {
      const date = new Date(transfer.blockTimestamp);
      const DateString = date.toLocaleDateString();
      const fromAddress = EvmAddress.create(transfer.fromAddress);

      let Value = BigDecimal(transfer.value.toString() || 0, decimals);
      if (fromAddress.equals(walletEvmAddress)) {
        Value = Value.negated();
      }

      const previous = last(accum);
      const Balance = previous?.Balance.plus(Value) ?? Value;
      let previousValuePerDay =
        previous?.ValuePerDay ?? BigDecimal(0, decimals);
      if (previous?.Date !== DateString) {
        previousValuePerDay = BigDecimal(0, decimals);
      }
      const ValuePerDay = previousValuePerDay.plus(Value);

      const entry: Entry<Erc20TransactionInput> = {
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
      if (previous && previous?.Tx === transfer.transactionHash) {
        previous.Value = previous.Value.plus(Value);
        previous.Balance = previous.Balance.plus(Value);
        previous.ValuePerDay = previous.ValuePerDay.plus(Value);

        return accum;
      }

      return [...accum, entry];
    }, [] as Entry<Erc20TransactionInput>[]);
};
