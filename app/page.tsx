"use client";
import { Button, Divider, Text } from "@blueprintjs/core";
import { useMemo } from "react";
import { useToggle } from "usehooks-ts";
import { Section, Table } from "./_components";
import {
  CompareEntityCellRenderer,
  CompareEntityHeaders,
} from "./_components/cell/compareEntityCellRenderer";
import { useBalances } from "./_provider/balanceProvider";

export default function Home() {
  const {
    selectedInfo,
    comparedEntities,
    comparedBalance: balance,
    transactionBalance: explorerBalance,
    accointingBalance,
  } = useBalances();

  const [hideValid, toggleValid] = useToggle(false);

  const entries = useMemo(() => {
    if (!comparedEntities) return;

    return comparedEntities?.filter((entry) => {
      if (
        hideValid &&
        entry.DiffBalance.isZero() &&
        entry.DiffValue.isZero() &&
        entry.DiffFee.isZero()
      )
        return false;

      return true;
    });
  }, [comparedEntities, hideValid]);

  return (
    <main>
      <h1>Overview</h1>

      <Section
        subtitle={selectedInfo?.walletAddress}
        title={selectedInfo?.name}
        rightElement={
          <>
            <Button
              icon={hideValid ? "eye-open" : "eye-off"}
              onClick={toggleValid}
            >
              {hideValid ? "Show All" : "Show Invalid"}
            </Button>
            <Divider />
            <Text title={explorerBalance.toFixed()}>
              Chain: {explorerBalance.toFixed(6)}
            </Text>
            <Text title={accointingBalance.toFixed()}>
              Accointing: {accointingBalance.toFixed(6)}
            </Text>
            <Text title={balance?.toFixed() || "0"}>
              Diff: {balance?.toFixed(6) || 0}
            </Text>
          </>
        }
      >
        <Table
          entries={entries}
          cellRenderer={CompareEntityCellRenderer}
          headers={CompareEntityHeaders}
        />
      </Section>
    </main>
  );
}
