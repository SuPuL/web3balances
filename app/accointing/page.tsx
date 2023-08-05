"use client";
import {
  Table,
  Section,
  EntityCellRenderer,
  EntityHeaders,
} from "@/_components";
import { useBalances } from "@/_provider/balanceProvider";
import { Button } from "@blueprintjs/core";
import { useToggle } from "usehooks-ts";
import { useMemo } from "react";

export default function Home() {
  const {
    wallet,
    accointingBalance: balance,
    accointingEntries,
  } = useBalances();

  const [hideIgnored, toggleIgnored] = useToggle(true);
  const [hideEmpty, toggleEmpty] = useToggle(true);

  const entries = useMemo(() => {
    if (!accointingEntries) return;

    return accointingEntries?.filter((entry) => {
      if (hideIgnored && entry.ignored) return false;

      if (hideEmpty && entry.Fee === 0 && entry.Value == 0) return false;

      return true;
    });
  }, [accointingEntries, hideIgnored, hideEmpty]);

  return (
    <main>
      <h1>Accointing</h1>

      <Section
        subtitle={wallet?.address}
        title={wallet?.name}
        rightElement={
          <>
            <Button
              icon={hideIgnored ? "eye-open" : "eye-off"}
              onClick={toggleIgnored}
            >
              {hideIgnored ? "Show Ignored" : "Hide Ignored"}
            </Button>
            <Button
              icon={hideEmpty ? "layer-outline" : "layer"}
              onClick={toggleEmpty}
            >
              {hideEmpty ? "Show Empty" : "Hide Empty"}
            </Button>
            {balance}
          </>
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
