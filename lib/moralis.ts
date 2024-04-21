import { EvmChain, EvmChainish } from "@moralisweb3/common-evm-utils";
import { Chain } from "@prisma/client";
import Moralis from "moralis";

export type MoralisApi = typeof Moralis;

export const getMoralisChain = (
  symbol?: Chain | null
): EvmChain | undefined => {
  if (!symbol) return undefined;

  switch (symbol) {
    case Chain.ETH:
      return EvmChain.ETHEREUM;
    case Chain.BNB:
      return EvmChain.BSC;
    case Chain.MATIC:
      return EvmChain.POLYGON;
    case Chain.OPTIMISM:
      return EvmChain.OPTIMISM;
    case Chain.ARBITRUM:
      return EvmChain.ARBITRUM;
    default:
      return undefined;
  }
};

export const getChain = (symbol?: EvmChainish): Chain | undefined => {
  if (!symbol) return undefined;

  const symbolHex = symbol instanceof EvmChain ? symbol.hex : symbol;

  switch (symbolHex) {
    case EvmChain.ETHEREUM.hex:
      return Chain.ETH;
    case EvmChain.BSC.hex:
      return Chain.BNB;
    case EvmChain.POLYGON.hex:
      return Chain.MATIC;
    case EvmChain.OPTIMISM.hex:
      return Chain.OPTIMISM;
    case EvmChain.ARBITRUM.hex:
      return Chain.ARBITRUM;
    default:
      return undefined;
  }
};
