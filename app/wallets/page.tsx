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
import { Cell } from "@blueprintjs/table";
import { endsWith } from "lodash";

type Entry = WalletTokenInfo;

const EntityHeaders: Headers<Entry> = [
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

  if (endsWith(columnName.toLowerCase(), "diff")) {
    style.backgroundColor = "#BFBFBF";

    if (value != 0) {
      style.backgroundColor = "#D24D57";
    }
  }

  return <Cell style={style}>{value?.toString()}</Cell>;
};

export default function Home() {
  const { infoList: entries } = useWalletTokenInfoProvider();

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
        />
      </Section>
    </main>
  );
}
