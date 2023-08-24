"use client";
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { EvmChain } from "@moralisweb3/common-evm-utils";
import Moralis from "moralis";

export type MoralisApi = typeof Moralis;

type MoralisContextType = {
  moralis: MoralisApi | undefined;
  initialized: boolean;
  getChainFromSymbol: (symbol: string) => EvmChain | undefined;
};

const MoralisContext = createContext<MoralisContextType>({
  moralis: undefined,
  initialized: false,
  getChainFromSymbol: () => undefined,
});

export const useMoralis = (): MoralisContextType => useContext(MoralisContext);

type MoralisProviderProps = {
  moralisApiKey: string;
  children: React.ReactNode;
};

export const MoralisProvider = ({
  moralisApiKey,
  children,
}: MoralisProviderProps) => {
  const [initialized, setInitialized] = useState(false);
  const [moralis, setMoralis] = useState<MoralisApi | undefined>(undefined);

  useEffect(() => {
    if (!moralisApiKey || initialized) {
      return;
    }

    setInitialized(true);

    const initMoralis = async () => {
      await Moralis.start({
        apiKey: moralisApiKey,
      });

      setMoralis(Moralis);
    };

    initMoralis();
  }, [initialized, moralisApiKey]);

  const value = useMemo(() => {
    return {
      moralis,
      initialized,
      getChainFromSymbol: getMoralisChain,
    };
  }, [moralis, initialized]);

  return (
    <MoralisContext.Provider value={value}>{children}</MoralisContext.Provider>
  );
};

export const getMoralisChain = (symbol?: string): EvmChain | undefined => {
  if (!symbol) return undefined;

  switch (symbol.toUpperCase()) {
    case "ETH":
      return EvmChain.ETHEREUM;
    case "BNB":
      return EvmChain.BSC;
    case "MATIC":
      return EvmChain.POLYGON;
    default:
      return undefined;
  }
};
