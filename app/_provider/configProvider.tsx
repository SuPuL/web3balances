"use client";
import { ComponentProps, Chain } from "@/_common";
import { createContext, useContext } from "react";
import { Address } from "viem";

export type ConfigContextProps = {
  chainExplorerHistoryFile: string;
  chainExplorerInternalHistoryFile: string;
  accointingInternalHistoryFile: string;
  walletsFile: string;
};

const ConfigContext = createContext<ConfigContextProps>({
  chainExplorerHistoryFile: "",
  chainExplorerInternalHistoryFile: "",
  accointingInternalHistoryFile: "",
  walletsFile: "",
});

export const useConfig = (): ConfigContextProps => useContext(ConfigContext);

const ConfigProvider = ({
  children,
  ...config
}: ComponentProps<ConfigContextProps>) => {
  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
};

export default ConfigProvider;
