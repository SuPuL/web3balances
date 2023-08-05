import { Entry, HeaderName, isKeyOf } from "@/_common";
import { Cell } from "@blueprintjs/table";

export const CellRenderer = <T extends object = object>(
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

  return <Cell>{value?.toString()}</Cell>;
};
