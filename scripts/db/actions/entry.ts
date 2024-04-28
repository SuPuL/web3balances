import {
  BlockpitTransformer,
  Erc20Transformer,
  NativeTransformer,
} from "@lib/entry";
import { PrismaClient } from "@prisma/client";

const types = ["blockpit", "native", "erc20"] as const;
export type ProcessingType = (typeof types)[number];
export const ProcessingTypes = [...types] as ProcessingType[];

type Options = {
  types: ProcessingType[];
  walletIds?: number[];
};

export const importEntries = async ({ types, walletIds }: Options) => {
  console.info(`Start transform transactions...`);

  if (!types.length) {
    throw new Error(`No types provided`);
  }

  const prisma = new PrismaClient();

  const transformers = types.map((type) => {
    switch (type) {
      case "blockpit":
        return BlockpitTransformer({ prisma });
      case "native":
        return NativeTransformer({ prisma });
      case "erc20":
        return Erc20Transformer({ prisma });
      default:
        throw new Error(`Unknown type ${type}`);
    }
  });

  // get wallets
  const wallets = await prisma.wallet.findMany({
    where: walletIds ? { id: { in: walletIds } } : {},
  });

  for (const transformer of transformers) {
    for (const wallet of wallets) {
      console.log(`${transformer.entryType}: wallet ${wallet.id}.`);
      const data = await transformer.transform(wallet);
      console.log(
        `Inserted ${data.length} transactions for wallet ${wallet.id}.`
      );
    }
  }

  console.log(`Done 👍`);
};
