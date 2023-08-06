"use client";
import {
  Table,
  Section,
  EntityCellRenderer,
  EntityHeaders,
} from "@/_components";
import { Text } from "@blueprintjs/core";
import { useBalances } from "@/_provider/balanceProvider";

export default function Home() {
  const {
    selectedInfo,
    transactions: entries,
    transactionBalance: balance,
  } = useBalances();

  return (
    <main>
      <h1>Transactions</h1>

      <Section
        subtitle={selectedInfo?.walletAddress}
        title={selectedInfo?.name}
        rightElement={
          <Text title={balance?.toFixed() || "0"}>
            Balance: {balance?.toFixed(6) || 0}
          </Text>
        }
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
