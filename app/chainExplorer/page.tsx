"use client";
import {
  Table,
  Section,
  EntityCellRenderer,
  EntityHeaders,
} from "@/_components";
import { useBalances } from "@/_provider/balanceProvider";

export default function Home() {
  const {
    selectedInfo,
    explorerEntries: entries,
    explorerBalance: balance,
  } = useBalances();

  return (
    <main>
      <h1>Transactions</h1>

      <Section
        subtitle={selectedInfo?.walletAddress}
        title={selectedInfo?.name}
        rightElement={<>{balance}</>}
      >
        <Table
          entries={entries}
          headers={EntityHeaders}
          cellRenderer={EntityCellRenderer}
        />
      </Section>
    </main>
  );
}
