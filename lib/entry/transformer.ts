import { oppProps } from "@lib/decimals";
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

    const allTxs = txs.reduce(
      (entries, tx) => [
        ...entries,
        this.transformMethod(wallet, tx, findLast(entries, { ignored: false })),
      ],
      [] as Prisma.EntryCreateManyInput[]
    );
    // now lets merge entries by tx hash
    const data = allTxs.reduce((entries, entry) => {
      const last = findLast(entries, { tx: entry.tx });
      if (!last) {
        return [...entries, entry];
      }

      addNSet(last, entry, "value");
      addNSet(last, entry, "fee");

      last.balance = entry.balance;
      last.valuePerDay = entry.valuePerDay;
      last.feePerDay = entry.feePerDay;

      return entries;
    }, [] as Prisma.EntryCreateManyInput[]);

    await this.prisma.entry.deleteMany({
      where: { walletId: wallet.id, type: this.entryType },
    });
    await this.prisma.entry.createMany({ data });

    return data;
  };
}

const addNSet = <T>(left: T, right: T | undefined, prop: keyof T) => {
  left[prop] = oppProps(left, right, prop, (l, r) => l.plus(r)) as any;
};

const addByProp = <T>(left: T, right: T | undefined, prop: keyof T) =>
  oppProps(left, right, prop, (l, r) => l.plus(r));
