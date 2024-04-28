import { EntryType, Prisma, PrismaClient, Wallet } from "@prisma/client";
import { findLast } from "lodash";
import { Source, TransfomerOptions, TransformMethod, Txs } from "./types";

export class Transformer<T extends Txs> {
  protected prisma: PrismaClient;
  public entryType: EntryType;
  protected source: Source<T>;
  protected transformMethod: TransformMethod<T>;

  constructor({
    prisma,
    entryType,
    source,
    transformMethod,
  }: TransfomerOptions<T>) {
    this.prisma = prisma;
    this.entryType = entryType;
    this.source = source;
    this.transformMethod = transformMethod;
  }

  transform = async (
    wallet: Wallet
  ): Promise<Prisma.EntryCreateManyInput[]> => {
    const txs = await this.source(wallet);

    const data = txs.reduce(
      (entries, tx) => [
        ...entries,
        this.transformMethod(wallet, tx, findLast(entries, { ignored: false })),
      ],
      [] as Prisma.EntryCreateManyInput[]
    );
    await this.prisma.entry.deleteMany({
      where: { walletId: wallet.id, type: this.entryType },
    });
    await this.prisma.entry.createMany({ data });

    return data;
  };
}
