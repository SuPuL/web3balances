import {
  CellRenderer,
  CompareEntry,
  HeaderName,
  Headers,
  isKeyOf,
} from "@app/_common";
import { Cell } from "@blueprintjs/table";
import { startsWith } from "lodash";
import { EntityCellStyle } from "./entityCellRenderer";

export const CompareEntityHeaders: Headers<CompareEntry> = [
  "balance",
  "compBalance",
  "diffBalance",
  "valuePerDay",
  "compValuePerDay",
  "diffValuePerDay",
  "feePerDay",
  "compFeePerDay",
  "diffFeePerDay",
  "value",
  "compValue",
  "diffValue",
  "fee",
  "compFee",
  "diffFee",
  "tx",
  "date",
  "method",
];

export const CompareEntityCellRenderer: CellRenderer<CompareEntry> = (
  entries: CompareEntry[],
  rowIndex: number,
  columnName: HeaderName<CompareEntry>
) => {
  if (!entries) return;

  const entry = entries[rowIndex];

  let value;
  if (isKeyOf(columnName, entries[rowIndex])) {
    value = entry[columnName];
  }

  const style = EntityCellStyle(
    columnName,
    value,
    entry,
    entries[rowIndex + 1]
  );

  if (startsWith(columnName.toLowerCase(), "diff")) {
    style.backgroundColor = "#BFBFBF";

    if (value != 0) {
      style.backgroundColor = "#D24D57";
    }
  }

  if (startsWith(columnName.toLowerCase(), "comp")) {
    style.backgroundColor = "#D2D7D3";
  }

  return (
    <Cell style={style} tooltip={`${entry.date}, ${entry.tx}`}>
      {value?.toString()}
    </Cell>
  );
};
