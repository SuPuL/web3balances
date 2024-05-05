"use client";

import { Button, Divider, Text } from "@blueprintjs/core";
import { JSONFetcher } from "@lib/superjson";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { CompareEntry } from "./_common";
import {
  CompareEntityCellRenderer,
  CompareEntityHeaders,
  Section,
  Table,
  TxMenu,
} from "./_components";
import { useWalletTokenInfoProvider } from "./_provider/walletsProvider";

export default function Home() {
  const { selectedInfo } = useWalletTokenInfoProvider();

  const { data, isLoading } = useSWR(
    selectedInfo ? `api/wallet/${selectedInfo?.id}/entries/compare` : null,
    JSONFetcher<CompareEntry[]>
  );

  const [hideValid, setHideValid] = useState(false);
  const [invalidData, setInvalidData] = useState<CompareEntry[]>([]);
  const [entries, setEntries] = useState(data);

  useEffect(
    () =>
      setInvalidData(
        data?.filter(
          (entry) =>
            !(
              entry.diffBalance.isZero() &&
              entry.diffValue.isZero() &&
              entry.diffFee.isZero()
            )
        ) || []
      ),
    [data]
  );

  useEffect(
    () => setEntries(hideValid ? invalidData : data),
    [hideValid, data, invalidData, setEntries]
  );

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
              onClick={() => setHideValid((prev) => !prev)}
            >
              {hideValid ? "Show All" : "Show Invalid"}
            </Button>
            <Divider />
            <Text title={selectedInfo?.onChainBalance.toFixed()}>
              Chain: {selectedInfo?.onChainBalance.toFixed(6)}
            </Text>
            <Text title={selectedInfo?.serviceBalance.toFixed()}>
              Tax Service: {selectedInfo?.serviceBalance.toFixed(6)}
            </Text>
            <Text title={selectedInfo?.balanceCheckDiff?.toFixed() || "0"}>
              Diff: {selectedInfo?.balanceCheckDiff?.toFixed(6) || 0}
            </Text>
          </>
        }
      >
        <Table
          entries={entries}
          isLoading={isLoading}
          cellRenderer={CompareEntityCellRenderer}
          headers={CompareEntityHeaders}
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
