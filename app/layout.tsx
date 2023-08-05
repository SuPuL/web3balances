import "@/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navigation } from "./_components";
import { BalanceProvider } from "./_provider/balanceProvider";
import ConfigProvider, { ConfigContextProps } from "./_provider/configProvider";
import WalletProvider from "./_provider/walletProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Balances Checker",
  description:
    "Simple app to check BNB balances from Chain Explorers and Accointing exports.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config: ConfigContextProps = {
    chainExplorerHistoryFile: "transactions.csv",
    chainExplorerInternalHistoryFile: "internalTransactions.csv",
    accointingInternalHistoryFile: "accointing.csv",
    walletsFile: "wallets.csv",
  };

  return (
    <html lang="en">
      <body className={inter.className}>
        <ConfigProvider {...config}>
          <WalletProvider>
            <BalanceProvider>
              <Navigation />
              {children}
            </BalanceProvider>
          </WalletProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
