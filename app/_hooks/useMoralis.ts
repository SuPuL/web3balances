import { Chain } from "@/_common";
import { useConfig } from "@/_provider/configProvider";
import { EvmChain, EvmChainish } from "@moralisweb3/common-evm-utils";
import Moralis from "moralis";
import { useEffect, useMemo, useState } from "react";

export type MoralisApi = typeof Moralis;

export const getMoralisChain = (chain?: Chain): EvmChainish | undefined => {
  switch (chain) {
    case "BNB":
      return EvmChain.BSC;
    case "ETH":
      return EvmChain.ETHEREUM;
    case "MATIC":
      return EvmChain.POLYGON;
    default:
      return undefined;
  }
};

export const useMoralis = (): MoralisApi | undefined => {
  const { moralisApiKey } = useConfig();
  const [initilized, setInitilized] = useState(false);

  useEffect(() => {
    if (!moralisApiKey || initilized) {
      return;
    }

    const initMoralis = async () => {
      setInitilized(true);
      await Moralis.start({
        apiKey: moralisApiKey,
      });
    };

    initMoralis();
  }, [initilized, moralisApiKey]);

  return useMemo(() => {
    return initilized ? Moralis : undefined;
  }, [initilized]);
};
