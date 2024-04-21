import "@app/globals.css";
import { Decimal } from "decimal.js";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import SuperJSON from "superjson";
import { BaseProps, ComponentProps } from "./_common/types";
import { Navigation } from "./_components";
import { getWalletOrFirst, getWallets } from "./_db/data";
import ConfigProvider, { ConfigContextProps } from "./_provider/configProvider";
import WalletTokenInfoProvider from "./_provider/walletsProvider";

const inter = Inter({ subsets: ["latin"] });

SuperJSON.registerCustom<Decimal, string>(
  {
    isApplicable: (v): v is Decimal => Decimal.isDecimal(v),
    serialize: (v) => v.toJSON(),
    deserialize: (v) => new Decimal(v),
  },
  "decimal.js"
);

export const metadata: Metadata = {
  title: "Balances Checker",
  description:
    "Simple app to check BNB balances from Chain Explorers and Blockpit exports.",
};

type LayoutProps = ComponentProps<{ params: BaseProps }>;

const RootLayout = async ({ children, params }: LayoutProps) => {
  const config: ConfigContextProps = {
    moralisApiKey: process.env.NEXT_PUBLIC_MORALIS_API_KEY || "",
  };

  const walletInfo = await getWalletOrFirst(params.id);
  const wallets = await getWallets();

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.className} suppressHydrationWarning={true}>
        <ConfigProvider {...config}>
          <WalletTokenInfoProvider
            walletInfos={wallets}
            selectedWallet={walletInfo}
            data-superjson
          >
            <Navigation key="nav" />
            {children}
          </WalletTokenInfoProvider>
        </ConfigProvider>
      </body>
    </html>
  );
};

export default RootLayout;
