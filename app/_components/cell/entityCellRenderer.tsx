"use client";
import { Entry, HeaderName, Headers, isKeyOf } from "@app/_common";
import { Cell } from "@blueprintjs/table";
import { isSameDay } from "date-fns";

export const EntityHeaders: Headers<Entry> = [
  "date",
  "balance",
  "valuePerDay",
  "feePerDay",
  "value",
  "fee",
  "tx",
  "method",
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
  if (nextEntry?.date && !isSameDay(entry.date, nextEntry?.date)) {
    style.borderBottom = "1px solid #ddd";

    if (["balance"].includes(columnName)) {
      style.backgroundColor = "#b6d7a8";
    }

    if (["feePerDay", "valuePerDay"].includes(columnName)) {
      style.backgroundColor = "#def1d6";
    }
  }

  if (entry.ignored) {
    style.backgroundColor = "#ddd";
  }

  return style;
};
