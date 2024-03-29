import "@/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navigation } from "./_components";
import { ServiceDataProvider } from "./_provider/serviceProvider";
import { BalanceProvider } from "./_provider/balanceProvider";
import ConfigProvider, { ConfigContextProps } from "./_provider/configProvider";
import { MoralisProvider } from "./_provider/moralisProvider";
import WalletTokenInfoProvider from "./_provider/walletTokenInfoProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Balances Checker",
  description:
    "Simple app to check BNB balances from Chain Explorers and Blockpit exports.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config: ConfigContextProps = {
    chainExplorerHistoryFile:
      process.env.NEXT_PUBLIC_CHAIN_HISTORY_CSV ||
      "${wallet}/${chain}_transactions.csv",
    chainExplorerInternalHistoryFile:
      process.env.NEXT_PUBLIC_CHAIN_HISTORY_INTERNAL_CSV ||
      "${wallet}/${chain}_internalTransactions.csv",
    blockpitInternalHistoryFile:
      process.env.NEXT_PUBLIC_BLOCKPIT_CSV || "blockpit.csv",
    walletsFile: process.env.NEXT_PUBLIC_WALLETS_CSV || "wallets.csv",
    moralisApiKey: process.env.NEXT_PUBLIC_MORALIS_API_KEY || "",
  };

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.className} suppressHydrationWarning={true}>
        <ConfigProvider {...config}>
          <MoralisProvider moralisApiKey={config.moralisApiKey}>
            <ServiceDataProvider
              historyFile={config.blockpitInternalHistoryFile}
            >
              <WalletTokenInfoProvider>
                <BalanceProvider>
                  <Navigation />
                  {children}
                </BalanceProvider>
              </WalletTokenInfoProvider>
            </ServiceDataProvider>
          </MoralisProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
