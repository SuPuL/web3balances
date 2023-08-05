"use client";
import { Entry, HeaderName, Headers, isKeyOf } from "@/_common";
import { Cell } from "@blueprintjs/table";

export const EntityHeaders: Headers<Entry> = [
  "Date",
  "Time",
  "Balance",
  "ValuePerDay",
  "FeePerDay",
  "Value",
  "Fee",
  "Tx",
  "Method",
];

export const EntityCellRenderer = <T extends Entry>(
  entries: T[],
  rowIndex: number,
  columnName: HeaderName<T>
) => {
  if (!entries) return;

  const entry = entries[rowIndex];
  if (!isKeyOf(columnName, entry)) {
    return;
  }

  const value = entry[columnName];

  const style = EntityCellStyle(
    columnName,
    value,
    entry,
    entries[rowIndex + 1]
  );

  return <Cell style={style}>{value?.toString()}</Cell>;
};

export const EntityCellStyle = (
  columnName: string,
  _value: unknown,
  entry: Entry,
  nextEntry?: Entry
): React.CSSProperties => {
  const style: React.CSSProperties = {};
  if (entry.Date !== nextEntry?.Date) {
    style.borderBottom = "1px solid #ddd";

    if (["Balance"].includes(columnName)) {
      style.backgroundColor = "#b6d7a8";
    }

    if (["FeePerDay", "ValuePerDay"].includes(columnName)) {
      style.backgroundColor = "#def1d6";
    }
  }

  if (entry.ignored) {
    style.backgroundColor = "#ddd";
  }

  return style;
};
