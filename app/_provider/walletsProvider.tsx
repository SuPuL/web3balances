"use client";
import { ComponentProps, WalletTokenInfo } from "@app/_common";
import { first, noop } from "lodash";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useCookies } from "react-cookie";

export type WalletTokenInfoProviderProps = {
  walletInfos: WalletTokenInfo[];
  selectedWallet?: WalletTokenInfo;
};

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
  selectedWallet,
  walletInfos,
}: ComponentProps<WalletTokenInfoProviderProps>) => {
  const [selectedInfo, _setSelectedInfo] = useState<
    WalletTokenInfo | undefined
  >();
  const [infoList] = useState<WalletTokenInfo[]>(walletInfos);
  const [cookies, setCookie] = useCookies(["balancesWalletId"]);

  useEffect(() => {
    const fetch = async () => {
      const selectedId = Number(cookies.balancesWalletId);
      const selected = walletInfos.find((w) => w.id === selectedId);
      _setSelectedInfo(selected || selectedWallet || first(selectedWallet));
    };

    fetch();
  }, [cookies.balancesWalletId, selectedWallet, walletInfos]);

  const setSelectedInfo = useCallback(
    (info: WalletTokenInfo) => {
      _setSelectedInfo(info);
      setCookie("balancesWalletId", `${info.id}`);
    },
    [setCookie]
  );

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
