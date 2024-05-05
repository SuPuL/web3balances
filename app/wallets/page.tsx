"use client";
import {
  CellRenderer,
  HeaderName,
  Headers,
  WalletTokenInfo,
  isKeyOf,
} from "@app/_common";
import { Section, Table } from "@app/_components";
import { useWalletTokenInfoProvider } from "@app/_provider/walletsProvider";
import { MenuItem } from "@blueprintjs/core";
import { Cell, Regions } from "@blueprintjs/table";
import { endsWith } from "lodash";

type Entry = WalletTokenInfo;

const EntityHeaders: Headers<Entry> = [
  "checked",
  "id",
  "symbol",
  "name",
  "onChainBalance",
  "onChainBalanceLocal",
  "onChainBalanceDiff",
  "serviceBalance",
  "serviceBalanceLocal",
  "serviceBalanceDiff",
  "balanceDiff",
  "balanceCheckDiff",
  "compareEntryDiff",
  "walletAddress",
  "chain",
  "type",
  "tokenAddress",
  "decimals",
];

const TokenInfoCellRenderer: CellRenderer<Entry> = (
  entries: Entry[],
  rowIndex: number,
  columnName: HeaderName<Entry>
) => {
  const info = entries[rowIndex];
  if (!info) return;

  let value;
  if (isKeyOf(columnName, entries[rowIndex])) {
    value = info[columnName];
  }
  const style: React.CSSProperties = {};

  if (info.checked) {
    style.backgroundColor = "#7DA177";
  }

  if (endsWith(columnName.toLowerCase(), "diff")) {
    if (!info.checked) {
      style.backgroundColor = "#BFBFBF";
    }

    if (value != 0) {
      style.backgroundColor = "#D24D57";
    }
  }

  return <Cell style={style}>{value?.toString()}</Cell>;
};

export default function Home() {
  const {
    infoList: entries,
    markChecked,
    recalculate,
  } = useWalletTokenInfoProvider();

  return (
    <main>
      <h1>Wallets</h1>

      <Section
        title="Options"
        rightElement={<>{/* <Button onClick={reload}>Reload</Button> */}</>}
      >
        <Table
          entries={entries}
          headers={EntityHeaders}
          cellRenderer={TokenInfoCellRenderer}
          menuItemsRenderer={({ getCellDataByName, context }) => (
            <>
              <MenuItem
                onClick={async () => {
                  const cells = context.getUniqueCells();
                  const sparse = Regions.sparseMapCells(cells, (r) => ({
                    id: Number(getCellDataByName(r, "id")),
                    checked: !Boolean(getCellDataByName(r, "checked") || false),
                  }))?.flat();

                  await markChecked?.(sparse || []);
                }}
                icon="new-link"
                text="(Un)Check"
              />
              <MenuItem
                onClick={async () => {
                  const cells = context.getUniqueCells();
                  const sparse = Regions.sparseMapCells(cells, (r) =>
                    Number(getCellDataByName(r, "id"))
                  )?.flat();

                  await recalculate?.(sparse || []);
                }}
                icon="new-link"
                text="Recalculate"
              />
            </>
          )}
        />
      </Section>
    </main>
  );
}
