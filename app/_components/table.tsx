import { CellRenderer, Headers } from "@app/_common";
import { HotkeysProvider, Menu } from "@blueprintjs/core";
import {
  MenuContext as BSMenuContext,
  Column,
  CopyCellsMenuItem,
  RegionCardinality,
  Table2,
  TableLoadingOption,
  Utils,
} from "@blueprintjs/table";
import { startCase } from "lodash";
import { useCallback, useEffect, useState } from "react";

export type MenuContext<T = Object> = {
  getCellData: (rowIndex: number, columnIndex: number) => any;
  getCellDataByName: (
    rowIndex: number,
    columnName: Extract<keyof T, string>
  ) => any;
  context: BSMenuContext;
};

export type ContextMenuRenderer<T = Object> = (
  context: MenuContext<T>
) => JSX.Element;

export interface TableProps<T extends Object> {
  entries?: T[];
  cellRenderer: CellRenderer<T>;
  headers: Headers<T>;
  isLoading?: boolean;
  menuItemsRenderer?: ContextMenuRenderer<T>;
}

const loadingState = [
  TableLoadingOption.CELLS,
  TableLoadingOption.ROW_HEADERS,
  TableLoadingOption.COLUMN_HEADERS,
];

export function Table<T extends object = object>({
  entries: entriesIn,
  cellRenderer,
  headers,
  isLoading,
  menuItemsRenderer,
}: TableProps<T>) {
  const [columns, setColumns] = useState<Headers<T>>(headers);
  const [entries, setEntries] = useState<T[]>(entriesIn || []);

  useEffect(() => {
    setEntries([...(entriesIn || [])]);
  }, [entriesIn]);

  const handleColumnsReordered = useCallback(
    (oldIndex: number, newIndex: number, length: number) => {
      if (oldIndex === newIndex) {
        return;
      }

      const newHeaders = Utils.reorderArray(
        columns,
        oldIndex,
        newIndex,
        length
      );
      if (newHeaders) {
        setColumns(newHeaders);
      }
    },
    [columns]
  );

  const renderBodyContextMenu = useCallback(
    (context: BSMenuContext) => {
      const getCellData = (rowIndex: number, columnIndex: number): any =>
        entries?.[rowIndex]?.[columns[columnIndex]];

      const getCellDataByName = (
        rowIndex: number,
        columnName: Extract<keyof T, string>
      ): any => entries?.[rowIndex]?.[columnName];

      return (
        <Menu>
          {menuItemsRenderer?.({
            context,
            getCellData,
            getCellDataByName,
          })}
          <CopyCellsMenuItem
            context={context}
            getCellData={getCellData}
            text="Copy Value"
          />
        </Menu>
      );
    },
    [menuItemsRenderer, columns, entries]
  );

  return (
    <HotkeysProvider>
      <Table2
        numRows={entries.length}
        enableColumnReordering={true}
        enableMultipleSelection={true}
        onColumnsReordered={handleColumnsReordered}
        selectionModes={[
          RegionCardinality.FULL_COLUMNS,
          RegionCardinality.FULL_ROWS,
          RegionCardinality.CELLS,
        ]}
        cellRendererDependencies={[columns, entries]}
        bodyContextMenuRenderer={renderBodyContextMenu}
        loadingOptions={isLoading ? loadingState : undefined}
      >
        {columns.map((columnName, columnIndex) => (
          <Column
            key={columnIndex}
            name={columnName}
            nameRenderer={(name) => <>{startCase(name)}</>}
            cellRenderer={(rowIndex) =>
              cellRenderer(entries, rowIndex, columnName)
            }
          />
        ))}
      </Table2>
    </HotkeysProvider>
  );
}
