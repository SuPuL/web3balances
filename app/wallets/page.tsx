"use client";
import {
  CellRenderer,
  HeaderName,
  Headers,
  WalletTokenInfo,
  isKeyOf,
} from "@/_common";
import { Button } from "@blueprintjs/core";
import { Section, Table } from "@/_components";
import { useWalletTokenInfoProvider } from "@/_provider/walletTokenInfoProvider";
import { Cell } from "@blueprintjs/table";
import { startsWith } from "lodash";

const EntityHeaders: Headers<WalletTokenInfo> = [
  "symbol",
  "name",
  "explorerBalance",
  "serviceCalcBalance",
  "serviceBalance",
  "diffBalance",
  "walletAddress",
  "chain",
  "type",
  "tokenAddress",
  "decimals",
];

const TokenInfoCellRenderer: CellRenderer<WalletTokenInfo> = (
  entries: WalletTokenInfo[],
  rowIndex: number,
  columnName: HeaderName<WalletTokenInfo>
) => {
  if (!entries) return;

  const entry = entries[rowIndex];

  let value;
  if (isKeyOf(columnName, entries[rowIndex])) {
    value = entry[columnName];
  }
  const style: React.CSSProperties = {};

  if (startsWith(columnName.toLowerCase(), "diff")) {
    style.backgroundColor = "#BFBFBF";

    if (value != 0) {
      style.backgroundColor = "#D24D57";
    }
  }

  if (
    columnName == "serviceBalance" &&
    !entry.virtual &&
    !entry.serviceCalcBalance.isEqualTo(entry.serviceBalance)
  ) {
    style.backgroundColor = "#FFAA33";
  }

  return <Cell style={style}>{value?.toString()}</Cell>;
};

export default function Home() {
  const { infoList, reload } = useWalletTokenInfoProvider();

  return (
    <main>
      <h1>Wallets</h1>

      <Section
        title="Options"
        rightElement={
          <>
            <Button onClick={reload}>Reload</Button>
          </>
        }
      >
        <Table
          entries={infoList}
          headers={EntityHeaders}
          cellRenderer={TokenInfoCellRenderer}
        />
      </Section>
    </main>
  );
}
