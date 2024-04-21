import { NormBN, Zero } from "@lib/bigNumber";
import { Entry } from "../types";
import { Transformer, Transaction as TransformerTransaction } from "./types";

interface BaseTransaction extends TransformerTransaction {
  Blockno: string;
  ContractAddress: string;
  CurrentValue: string;
  DateTime: string;
  ErrCode: string;
  From: string;
  Status: string;
  Txhash: string;
  UnixTimestamp: string;
  [key: string]: string | number | undefined;
}

interface Transaction extends BaseTransaction {
  Historical: string;
  Method: string;
  To: string;
  "TxnFee(USD)": string;
}

interface InternalTransaction extends BaseTransaction {
  HistoricalPrice: string;
  ParentTxBNBValue: string;
  ParentTxFrom: string;
  ParentTxTo: string;
  Type: string;
}

export class ScannerTransformer<
  T extends Transaction,
  I extends InternalTransaction
> implements Transformer<T, I>
{
  constructor(
    private valueInKey: string,
    private valueOutKey: string,
    private txFeeKey: string
  ) {}

  transform(
    address: string,
    transactions: Transaction[],
    internals: InternalTransaction[]
  ): Entry<BaseTransaction>[] {
    const publicTxs = transactions.filter((t) => t.Txhash);
    const internalTxs = internals.filter((t) => t.Txhash);

    const notMergedInternal = this.mergeAndGetRest(publicTxs, internalTxs);
    const allTransactions = [...publicTxs, ...notMergedInternal].sort(
      (a, b) => Number(a.UnixTimestamp) * 1000 - Number(b.UnixTimestamp) * 1000
    );

    return this.toEntities(address, allTransactions);
  }

  private mergeAndGetRest(
    transactions: Transaction[],
    internals: InternalTransaction[]
  ): InternalTransaction[] {
    // Check each internal transaction if it is already in the public transactions. If so, we merge them.
    // And return all not merged.
    const notMergedInternals: InternalTransaction[] = [];
    internals.forEach((internal) => {
      const tx = transactions.find((tx) => tx.Txhash === internal.Txhash);
      if (tx) {
        tx[this.valueInKey] =
          Number(tx?.[this.valueInKey]) + Number(internal?.[this.valueInKey]);

        tx[this.valueOutKey] =
          Number(tx?.[this.valueOutKey]) + Number(internal?.[this.valueOutKey]);
      } else {
        notMergedInternals.push(internal);
      }
    });

    return notMergedInternals;
  }

  private toEntities(
    address: string,
    transactions: BaseTransaction[]
  ): Entry<BaseTransaction>[] {
    return transactions.reduce((accum, entry, index) => {
      if (!entry.From) {
        return accum;
      }

      const DateTime = new Date(Number(entry.UnixTimestamp) * 1000);
      const DateString = DateTime.toLocaleDateString();

      const Value = NormBN(entry[this.valueInKey]).minus(
        NormBN(entry[this.valueOutKey])
      );

      const Fee =
        entry.From?.toLowerCase() === address.toLowerCase() &&
        this.txFeeKey in entry
          ? NormBN(Number(entry?.[this.txFeeKey]))
          : Zero();

      const Balance = NormBN(accum[index - 1]?.Balance)
        .plus(Value)
        .minus(Fee);

      const previous = accum[index - 1];
      let previousFeePerDay = NormBN(previous?.FeePerDay);
      let previousValuePerDay = NormBN(previous?.ValuePerDay);
      if (previous?.Date !== DateString) {
        previousFeePerDay = Zero();
        previousValuePerDay = Zero();
      }

      const FeePerDay = previousFeePerDay.plus(Fee);
      const ValuePerDay = previousValuePerDay.plus(Value);

      const methodProp = (
        "Method" in entry ? "Method" : "Type"
      ) as keyof BaseTransaction;
      const Method = entry[methodProp] as string;

      const newEntry: Entry<BaseTransaction> = {
        timestamp: DateTime.getTime(),
        Date: DateString,
        Time: DateTime.toLocaleTimeString(),
        Balance,
        ValuePerDay,
        FeePerDay,
        Value,
        Fee,
        Tx: entry.Txhash,
        Method,
        src: entry,
      };

      return [...accum, newEntry];
    }, [] as Entry<BaseTransaction>[]);
  }
}
