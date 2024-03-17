import {
  CellRenderer,
  CompareEntry,
  HeaderName,
  Headers,
  isKeyOf,
} from "@/_common";
import { Cell } from "@blueprintjs/table";
import { startsWith } from "lodash";
import { EntityCellStyle } from "./entityCellRenderer";

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
    <Cell style={style} tooltip={`${entry.Date} ${entry.Time}, ${entry.Tx}`}>
      {value?.toString()}
    </Cell>
  );
};
