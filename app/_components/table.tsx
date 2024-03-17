import { CellRenderer, Chain, Headers } from "@/_common";
import { HotkeysProvider, Menu } from "@blueprintjs/core";
import {
  Column,
  CopyCellsMenuItem,
  MenuContext,
  RegionCardinality,
  Table2,
  Utils,
} from "@blueprintjs/table";
import { startCase } from "lodash";
import { useCallback, useEffect, useState } from "react";
import { OpenTxMenuItem } from "./cell/OpenTxMenuItem";

export interface TableProps<T extends object> {
  entries?: T[];
  cellRenderer: CellRenderer<T>;
  headers: Headers<T>;
  txColumn?: Extract<keyof T, string>;
  chain?: Chain;
}

export function Table<T extends object = object>({
  entries: entriesIn,
  cellRenderer,
  headers,
  txColumn,
  chain,
}: TableProps<T>) {
  const [columns, setColumns] = useState<Headers<T>>(headers);
  const [entries, setEntries] = useState<T[] | undefined>(entriesIn);

  useEffect(() => {
    setEntries(entriesIn);
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
    (context: MenuContext) => {
      const getCellData = (rowIndex: number, columnIndex: number): any =>
        getCellDataByName(rowIndex, columns[columnIndex]);

      const getCellDataByName = (
        rowIndex: number,
        columnName: Extract<keyof T, string>
      ): any => entries?.[rowIndex]?.[columnName];

      return (
        <Menu>
          {txColumn && (
            <CopyCellsMenuItem
              context={context}
              getCellData={(r) => getCellDataByName(r, txColumn)}
              text="Copy Tx"
            />
          )}
          {txColumn && chain && (
            <OpenTxMenuItem
              context={context}
              getCellData={(r) => ({
                tx: getCellDataByName(r, txColumn),
                chain,
              })}
              text="Open Tx"
            />
          )}
          <CopyCellsMenuItem
            context={context}
            getCellData={getCellData}
            text="Copy Value"
          />
        </Menu>
      );
    },
    [columns, entries, chain, txColumn]
  );

  return (
    <HotkeysProvider>
      {entries ? (
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
          cellRendererDependencies={[columns]}
          bodyContextMenuRenderer={renderBodyContextMenu}
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
      ) : (
        <></>
      )}
    </HotkeysProvider>
  );
}
