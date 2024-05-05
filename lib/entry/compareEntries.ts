import { INACCUARCY } from "@app/_common/utils";
import { NormDecimal, safeDiff, Zero } from "@lib/decimals";
import { DI } from "@lib/di";
import { Entry, EntryType, Prisma, Wallet } from "@prisma/client";
import Decimal from "decimal.js";
import _ from "lodash";

export type Options = DI;

export const compareEntriesForWallet = async (
  wallet: Wallet,
  { db }: Options
) => {
  const serviceEntries = await getEntries(db, wallet.id, "SERVICE");
  const onChainEntries = await getEntries(db, wallet.id, wallet.type);

  const data = createCompareEntries(onChainEntries, serviceEntries);

  await db.entryComparison.deleteMany({
    where: { walletId: wallet.id },
  });
  await db.entryComparison.createMany({ data });

  return data;
};

const createCompareEntries = (
  onChainEntries: Entry[],
  serviceEntries: Entry[]
): Prisma.EntryComparisonCreateManyInput[] => {
  const filtered = serviceEntries.filter(
    (entry) => !(entry.ignored || (entry.fee.isZero() && entry.value.isZero()))
  );

  return onChainEntries.map((entry) => {
    // blockpit might have splitted the transaction into multiple entries. But only for native relevant (splitted NFTs mints etc.).
    // ERC20 are strictly 1:1
    const txs = _.chain(filtered).filter(({ tx }) => tx === entry.tx);
    const lastTx = txs.last().value();

    const [compBalance, diffBalance] = safeDiffProps(entry, lastTx, "balance");
    const [compValuePerDay, diffValuePerDay] = safeDiffProps(
      entry,
      lastTx,
      "valuePerDay"
    );
    const [compFeePerDay, diffFeePerDay] = safeDiffProps(
      entry,
      lastTx,
      "feePerDay"
    );

    const compFee = txs
      .reduce((accum, num) => accum.plus(NormDecimal(num.fee)), Zero())
      .value();
    const diffFee = safeDiff(entry.fee, compFee);

    const compValue = txs
      .reduce((accum, num) => accum.plus(NormDecimal(num.value)), Zero())
      .value();
    const diffValue = safeDiff(entry.value, compValue);

    const compare: Prisma.EntryComparisonCreateManyInput = {
      ...entry,
      compBalance,
      diffBalance,
      compValuePerDay,
      diffValuePerDay,
      compFeePerDay,
      diffFeePerDay,
      compFee,
      diffFee,
      compValue,
      diffValue,
    };

    return compare;
  });
};

const getEntries = async (db: DI["db"], walletId: number, type: EntryType) =>
  db.entry.findMany({
    where: {
      walletId,
      type,
    },
    orderBy: {
      date: "asc",
    },
  });

const safeDiffProps = (
  entry: Entry,
  lastTx: Entry | undefined,
  prop: keyof Entry
) => {
  let comp = (lastTx?.[prop] as Decimal) || Zero();
  let diff = (entry[prop] as Decimal).minus(comp);
  if (diff.abs().lte(INACCUARCY)) {
    comp = entry[prop] as Decimal;
    diff = Zero();
  }

  return [comp, diff];
};
