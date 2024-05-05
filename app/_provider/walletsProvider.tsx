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
import SuperJSON from "superjson";

export type WalletTokenInfoProviderProps = {
  walletInfos: WalletTokenInfo[];
  selectedWallet?: WalletTokenInfo;
};

export type MarkWalletsCheckedPayload = Pick<
  WalletTokenInfo,
  "id" | "checked"
>[];

export type WalletTokenInfoApi = {
  selectedInfo?: WalletTokenInfo;
  setSelectedInfo?: (info: WalletTokenInfo) => void;
  markChecked?: (updates: MarkWalletsCheckedPayload) => Promise<void>;
  recalculate?: (ids: number[]) => Promise<void>;
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
  const [infoList, setInfoList] = useState<WalletTokenInfo[]>(walletInfos);
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

  const updateListPartials = useCallback(
    (updates: (Pick<WalletTokenInfo, "id"> & Partial<WalletTokenInfo>)[]) => {
      const updated = infoList.map((info) => {
        const update = updates.find((u) => u.id === info.id);
        if (update) {
          return { ...info, ...update };
        }

        return info;
      });

      setInfoList([...updated]);
    },
    [setInfoList, infoList]
  );

  const markChecked = useCallback(
    async (updates: MarkWalletsCheckedPayload) => {
      await fetch("/api/wallets/markChecked", {
        method: "POST",
        body: JSON.stringify(updates),
        headers: {
          "content-type": "application/json",
        },
      });

      updateListPartials(updates);
    },
    [updateListPartials]
  );

  const recalculate = useCallback(
    async (ids: number[]) => {
      const updates = await fetch("/api/wallets/recalculate", {
        method: "POST",
        body: JSON.stringify(ids),
        headers: {
          "content-type": "application/json",
        },
      });

      const wallets = SuperJSON.deserialize(
        await updates.json()
      ) as WalletTokenInfo[];
      updateListPartials(wallets);
    },
    [updateListPartials]
  );

  const info = useMemo(
    () => ({
      selectedInfo,
      infoList,
      setSelectedInfo,
      markChecked,
      recalculate,
    }),
    [infoList, selectedInfo, setSelectedInfo, markChecked, recalculate]
  );

  return (
    <WalletTokenInfoContext.Provider value={info}>
      {children}
    </WalletTokenInfoContext.Provider>
  );
};

export default WalletTokenInfoProvider;
