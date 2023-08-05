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
    wallet,
    explorerEntries: entries,
    explorerBalance: balance,
  } = useBalances();

  return (
    <main>
      <h1>Chain Explorer</h1>

      <Section
        subtitle={wallet?.address}
        title={wallet?.name}
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
