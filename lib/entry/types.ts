import {
  BlockpitTransaction,
  EntryType,
  MoralisErc20Transaction,
  MoralisNativeTransaction,
  Prisma,
  PrismaClient,
  Wallet,
} from "@prisma/client";

export type Txs =
  | BlockpitTransaction
  | MoralisErc20Transaction
  | MoralisNativeTransaction;
export type Source<T extends Txs> = (wallet: Wallet) => Promise<T[]>;

export type TransformMethod<T extends Txs> = (
  wallet: Wallet,
  tx: T,
  previous?: Prisma.EntryCreateManyInput
) => Prisma.EntryCreateManyInput;

export type TransformerFactoryParams = {
  prisma: PrismaClient;
};

export type TransfomerOptions<T extends Txs> = TransformerFactoryParams & {
  entryType: EntryType;
  source: Source<T>;
  transformMethod: TransformMethod<T>;
};
