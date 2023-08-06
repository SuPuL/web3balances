"use client";
import { ComponentProps } from "@/_common";
import { createContext, useContext } from "react";

export type ConfigContextProps = {
  chainExplorerHistoryFile: string;
  chainExplorerInternalHistoryFile: string;
  accointingInternalHistoryFile: string;
  walletsFile: string;
  moralisApiKey: string;
};

const ConfigContext = createContext<ConfigContextProps>({
  chainExplorerHistoryFile: "",
  chainExplorerInternalHistoryFile: "",
  accointingInternalHistoryFile: "",
  walletsFile: "",
  moralisApiKey: "",
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
