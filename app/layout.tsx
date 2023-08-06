import "@/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navigation } from "./_components";
import { BalanceProvider } from "./_provider/balanceProvider";
import ConfigProvider, { ConfigContextProps } from "./_provider/configProvider";
import WalletTokenInfoProvider from "./_provider/walletTokenInfoProvider";

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
    moralisApiKey: process.env.NEXT_PUBLIC_MORALIS_API_KEY || "",
  };

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.className} suppressHydrationWarning={true}>
        <ConfigProvider {...config}>
          <WalletTokenInfoProvider>
            <BalanceProvider>
              <Navigation />
              {children}
            </BalanceProvider>
          </WalletTokenInfoProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
