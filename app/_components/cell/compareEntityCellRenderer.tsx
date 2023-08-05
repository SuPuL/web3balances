import {
  CellRenderer,
  CompareEntry,
  HeaderName,
  Headers,
  isKeyOf,
} from "@/_common";
import { Cell } from "@blueprintjs/table";
import { EntityCellStyle, a } from "./entityCellRenderer";
import { startsWith } from "lodash";

export const CompareEntityHeaders: Headers<CompareEntry> = [
  "Balance",
  "CompBalance",
  "DiffBalance",
  "ValuePerDay",
  "CompValuePerDay",
  "DiffValuePerDay",
  "FeePerDay",
  "CompFeePerDay",
  "DiffFeePerDay",
  "Value",
  "CompValue",
  "DiffValue",
  "Fee",
  "CompFee",
  "DiffFee",
  "Tx",
  "Date",
  "Time",
  "Method",
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

  if (startsWith(columnName, "Diff")) {
    style.backgroundColor = "#BFBFBF";

    if (value != 0) {
      style.backgroundColor = "#D24D57";
    }
  }

  if (startsWith(columnName, "Comp")) {
    style.backgroundColor = "#D2D7D3";
  }

  return <Cell style={style}>{value?.toString()}</Cell>;
};
