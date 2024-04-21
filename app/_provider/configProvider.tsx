"use client";
import { ComponentProps } from "@app/_common";
import { Decimal } from "decimal.js";
import { createContext, useContext } from "react";
import { CookiesProvider } from "react-cookie";
import SuperJSON from "superjson";

SuperJSON.registerCustom<Decimal, string>(
  {
    isApplicable: (v): v is Decimal => Decimal.isDecimal(v),
    serialize: (v) => v.toJSON(),
    deserialize: (v) => new Decimal(v),
  },
  "decimal.js"
);

export type ConfigContextProps = {
  moralisApiKey: string;
};

const ConfigContext = createContext<ConfigContextProps>({
  moralisApiKey: "",
});

export const useConfig = (): ConfigContextProps => useContext(ConfigContext);

const ConfigProvider = ({
  children,
  ...config
}: ComponentProps<ConfigContextProps>) => {
  return (
    <ConfigContext.Provider value={config}>
      <CookiesProvider>{children}</CookiesProvider>
    </ConfigContext.Provider>
  );
};

export default ConfigProvider;
