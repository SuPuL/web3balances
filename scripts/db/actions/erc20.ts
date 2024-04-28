import { fromChainToBD } from "@lib/decimals";
import { MoralisApi, getChain, getMoralisEvmChain } from "@lib/moralis";
import {
  Erc20Transaction,
  Erc20TransactionData,
  EvmAddress,
  EvmChainish,
} from "@moralisweb3/common-evm-utils";
import {
  Chain,
  Prisma,
  PrismaClient,
  TokenInfoType,
  Wallet,
} from "@prisma/client";
import _ from "lodash";
import Moralis from "moralis";
import { zeroAddress } from "viem";

type Options = {
  moralisApiKey?: string;
};

export const importERC20 = async (options: Options) => {
  console.info(`Importing erc20 from moralis`);

  await Moralis.start({
    apiKey: options.moralisApiKey,
  });

  // get wallets
  const prisma = new PrismaClient();
  const wallets = await prisma.wallet.findMany({
    where: {
      type: TokenInfoType.ERC20,
      chain: { not: null },
      tokenAddress: { not: null },
    },
  });

  for (const wallet of wallets) {
    const mChain = getMoralisEvmChain(wallet.chain as Chain);
    if (!mChain || !wallet.walletAddress || !wallet.tokenAddress) continue;

    console.info(
      `Importing erc20 for wallet ${wallet.name} (${wallet.id}/${wallet.walletAddress}/${wallet.chain}/${wallet.symbol})`
    );

    // TODO: add force option
    // TODO: add import from date
    const alreadyImported = await prisma.moralisErc20Transaction.count({
      where: {
        wallet: wallet,
      },
    });

    if (alreadyImported > 0) {
      continue;
    }

    const transactions = await getERCTransfersForAccount(
      Moralis,
      wallet.walletAddress,
      mChain,
      wallet.tokenAddress
    );

    console.log(`Found ${transactions.length} transactions.`);

    await prisma.moralisErc20Transaction.createMany({
      data: transform(wallet, transactions),
    });

    console.log(`Inserted ${transactions.length} transactions.`);
  }

  console.log(`Done 👍`);
};

const transform = (
  wallet: Wallet,
  transfers: Erc20TransactionData[]
): Prisma.MoralisErc20TransactionCreateManyInput[] => {
  const { decimals, walletAddress, tokenAddress } = wallet;
  if (!walletAddress) return [];

  const tokenEvmAddress = EvmAddress.create(tokenAddress || zeroAddress);

  return _(transfers || [])
    .filter(({ address }) => tokenEvmAddress.equals(address))
    .sortBy("blockTimestamp")
    .reduce((accum, transfer) => {
      const chain = getChain(transfer.chain);
      if (!chain) return accum;

      let value = fromChainToBD(transfer.value.toString() || 0, decimals);

      const entry: Prisma.MoralisErc20TransactionCreateManyInput = {
        chain,
        transactionHash: transfer.transactionHash,
        address: transfer.address.checksum,
        blockTimestamp: transfer.blockTimestamp,
        blockNumber: transfer.blockNumber.toString(),
        blockHash: transfer.blockHash,
        toAddress: transfer.toAddress.checksum,
        fromAddress: transfer.fromAddress.checksum,
        value,
        transactionIndex: transfer.transactionIndex,
        logIndex: transfer.logIndex,
        possibleSpam: transfer.possibleSpam,
        walletId: wallet.id,
      };

      return [...accum, entry];
    }, [] as Prisma.MoralisErc20TransactionCreateManyInput[]);
};

async function getERCTransfersForAccount(
  moralis: MoralisApi,
  walletAddress: string,
  chain: EvmChainish,
  contractAddress: string
): Promise<Erc20TransactionData[]> {
  const result: Erc20Transaction[] = [];
  let cursor: string | undefined;

  let response = await moralis.EvmApi.token.getWalletTokenTransfers({
    address: walletAddress,
    chain: chain,
    cursor,
    contractAddresses: [contractAddress],
  });

  result.push(...response.result);

  while (response.hasNext()) {
    response = await response.next();
    result.push(...response.result);
  }

  return result;
}
