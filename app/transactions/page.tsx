"use client";
import { Entry } from "@app/_common";
import {
  EntityCellRenderer,
  EntityHeaders,
  Section,
  Table,
} from "@app/_components";
import { TxMenu } from "@app/_components/cell/txMenu";
import { useWalletTokenInfoProvider } from "@app/_provider/walletsProvider";
import { Text } from "@blueprintjs/core";
import { JSONFetcher } from "@lib/superjson";
import useSWR from "swr";

export default function Home() {
  const { selectedInfo } = useWalletTokenInfoProvider();

  const { data, isLoading } = useSWR(
    selectedInfo
      ? `api/wallet/${selectedInfo?.id}/entries/${selectedInfo?.type}`
      : null,
    JSONFetcher<Entry[]>
  );

  return (
    <main>
      <h1>Transactions</h1>

      <Section
        subtitle={selectedInfo?.walletAddress}
        title={selectedInfo?.name}
        rightElement={
          <Text title={selectedInfo?.onChainBalance?.toFixed() || "0"}>
            Balance: {selectedInfo?.onChainBalance?.toFixed(6) || 0}
          </Text>
        }
      >
        <Table
          entries={data}
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
