"use client";
import { useBalances } from "@/_provider";
import { Button, Divider, Text } from "@blueprintjs/core";
import { useMemo } from "react";
import { useToggle } from "usehooks-ts";
import { Table, Section } from "./_components";
import {
  CompareEntityCellRenderer,
  CompareEntityHeaders,
} from "./_components/cell/compareEntityCellRenderer";

export default function Home() {
  const {
    wallet,
    comparedEntities,
    comparedBalance: balance,
    explorerBalance,
    accointingBalance,
  } = useBalances();

  const [hideValid, toggleValid] = useToggle(false);

  const entries = useMemo(() => {
    if (!comparedEntities) return;

    return comparedEntities?.filter((entry) => {
      if (
        hideValid &&
        entry.DiffBalance === 0 &&
        entry.DiffValue === 0 &&
        entry.DiffFee === 0
      )
        return false;

      return true;
    });
  }, [comparedEntities, hideValid]);

  return (
    <main>
      <h1>Overview</h1>

      <Section
        subtitle={wallet?.address}
        title={wallet?.name}
        rightElement={
          <>
            <Button
              icon={hideValid ? "eye-open" : "eye-off"}
              onClick={toggleValid}
            >
              {hideValid ? "Show All" : "Show Invalid"}
            </Button>
            <Divider />
            <Text>Chain: {explorerBalance}</Text>
            <Text>Accointing: {accointingBalance}</Text>
            <Text>Diff: {balance}</Text>
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
