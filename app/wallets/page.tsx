"use client";
import { CellRenderer, HeaderName, Headers, isKeyOf } from "@/_common";
import { EntityCellStyle, Section, Table } from "@/_components";
import { WalletInfo, useWallets } from "@/_provider";
import { Cell } from "@blueprintjs/table";
import { startsWith } from "lodash";

export const EntityHeaders: Headers<WalletInfo> = [
  "Name",
  "Currency",
  "ExplorerBalance",
  "AccointingBalance",
  "DiffBalance",
  "Address",
  "Chain",
];

const WalletInfoCellRenderer: CellRenderer<WalletInfo> = (
  entries: WalletInfo[],
  rowIndex: number,
  columnName: HeaderName<WalletInfo>
) => {
  if (!entries) return;

  const entry = entries[rowIndex];

  let value;
  if (isKeyOf(columnName, entries[rowIndex])) {
    value = entry[columnName];
  }
  const style: React.CSSProperties = {};

  if (startsWith(columnName, "Diff")) {
    style.backgroundColor = "#BFBFBF";

    if (value != 0) {
      style.backgroundColor = "#D24D57";
    }
  }

  return <Cell style={style}>{value?.toString()}</Cell>;
};

export default function Home() {
  const { wallets } = useWallets();

  return (
    <main>
      <h1>Wallets</h1>

      <Section>
        <Table
          entries={wallets}
          headers={EntityHeaders}
          cellRenderer={WalletInfoCellRenderer}
        />
      </Section>
    </main>
  );
}
