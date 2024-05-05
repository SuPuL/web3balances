"use client";
import { Entry } from "@app/_common";
import {
  EntityCellRenderer,
  EntityHeaders,
  Section,
  Table,
  TxMenu,
} from "@app/_components";
import { useWalletTokenInfoProvider } from "@app/_provider/walletsProvider";
import { Button, Text } from "@blueprintjs/core";
import { JSONFetcher } from "@lib/superjson";
import { useMemo } from "react";
import useSWR from "swr";
import { useToggle } from "usehooks-ts";

export default function Home() {
  const { selectedInfo } = useWalletTokenInfoProvider();

  const { data, isLoading } = useSWR(
    selectedInfo ? `api/wallet/${selectedInfo?.id}/entries/service` : null,
    JSONFetcher<Entry[]>
  );

  const [hideIgnored, toggleIgnored] = useToggle(true);
  const [hideEmpty, toggleEmpty] = useToggle(true);

  const entries = useMemo(() => {
    if (!data) return;

    return data?.filter((entry) => {
      if (hideIgnored && entry.ignored) return false;

      if (hideEmpty && entry.fee.isZero() && entry.value.isZero()) return false;

      return true;
    });
  }, [data, hideIgnored, hideEmpty]);

  return (
    <main>
      <h1>Service</h1>

      <Section
        subtitle={selectedInfo?.walletAddress}
        title={selectedInfo?.name}
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

            <Text title={selectedInfo?.serviceBalance?.toFixed() || "0"}>
              Balance: {selectedInfo?.serviceBalance?.toFixed(6) || 0}
            </Text>

            <Text title={selectedInfo?.serviceBalanceLocal?.toFixed() || "0"}>
              Balance (local):{" "}
              {selectedInfo?.serviceBalanceLocal?.toFixed(6) || 0}
            </Text>
          </>
        }
      >
        <Table
          entries={entries}
          headers={EntityHeaders}
          cellRenderer={EntityCellRenderer}
          isLoading={isLoading}
          menuItemsRenderer={(context) => (
            <TxMenu
              txColumn="tx"
              chain={selectedInfo?.chain}
              context={context}
            />
          )}
        />
      </Section>
    </main>
  );
}
