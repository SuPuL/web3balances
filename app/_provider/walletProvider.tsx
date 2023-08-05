"use client";
import { Chain, ComponentProps, Wallet, TokenInfo } from "@/_common";
import { createContext, useContext, useMemo, useState } from "react";
import { useConfig } from "./configProvider";
import { useCSVData } from "@/_hooks";
import { first, noop } from "lodash";

export type WalletContextProps = {
  wallet?: Wallet;
  setWallet?: (wallet: Wallet) => void;
  wallets?: TokenInfo[];
};

const WalletContext = createContext<WalletContextProps>({
  wallet: undefined,
  wallets: undefined,
  setWallet: noop,
});

export const useWallets = (): WalletContextProps => useContext(WalletContext);

const WalletProvider = ({ children }: ComponentProps<WalletContextProps>) => {
  const { walletsFile } = useConfig();
  const [wallet, setWallet] = useState<Wallet | undefined>();

  const { data } = useCSVData<TokenInfo>({
    fileName: walletsFile,
  });

  const wallets = useMemo(() => {
    const wallets = data?.map((w) => ({
      ...w,
      DiffBalance: w.explorerBalance - w.AccointingBalance,
    }));

    const wallet = first(wallets);

    setWallet(
      wallet
        ? {
            name: wallet.name,
            address: wallet.address,
            currency: wallet.currency,
          }
        : undefined
    );

    return wallets;
  }, [data]);

  const info = useMemo(
    () => ({
      wallet,
      wallets,
      setWallet,
    }),
    [wallets, wallet, setWallet]
  );

  return (
    <WalletContext.Provider value={info}>{children}</WalletContext.Provider>
  );
};

export default WalletProvider;
