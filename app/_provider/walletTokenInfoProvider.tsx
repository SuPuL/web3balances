"use client";
import { ComponentProps, TokenInfoType, WalletTokenInfo } from "@/_common";
import { useCSVData } from "@/_hooks";
import { first, noop } from "lodash";
import { createContext, useContext, useMemo, useState } from "react";
import { useConfig } from "@/_provider/configProvider";

export type WalletTokenInfoApi = {
  selectedInfo?: WalletTokenInfo;
  setSelectedInfo?: (info: WalletTokenInfo) => void;
  infoList?: WalletTokenInfo[];
};

const WalletTokenInfoContext = createContext<WalletTokenInfoApi>({
  selectedInfo: undefined,
  infoList: undefined,
  setSelectedInfo: noop,
});

export const useWalletTokenInfoProvider = (): WalletTokenInfoApi =>
  useContext(WalletTokenInfoContext);

const WalletTokenInfoProvider = ({
  children,
}: ComponentProps<WalletTokenInfoApi>) => {
  const { walletsFile } = useConfig();
  const [selectedInfo, setSelectedInfo] = useState<
    WalletTokenInfo | undefined
  >();

  const { data } = useCSVData<WalletTokenInfo>({
    fileName: walletsFile,
  });

  const infoList = useMemo(() => {
    const infoList = data?.map((w) => ({
      ...w,
      diffBalance: w.explorerBalance - w.accointingBalance,
      type: (["MATIX", "BNB", "ETH"].includes(w.currency)
        ? "native"
        : "erc20") as TokenInfoType,
    }));

    const selectedInfo = first(infoList);

    setSelectedInfo(selectedInfo);

    return infoList;
  }, [data]);

  const info = useMemo(
    () => ({
      selectedInfo,
      infoList,
      setSelectedInfo,
    }),
    [infoList, selectedInfo, setSelectedInfo]
  );

  return (
    <WalletTokenInfoContext.Provider value={info}>
      {children}
    </WalletTokenInfoContext.Provider>
  );
};

export default WalletTokenInfoProvider;