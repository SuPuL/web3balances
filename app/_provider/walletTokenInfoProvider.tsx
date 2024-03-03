"use client";
import {
  BigDecimal,
  Chain,
  ComponentProps,
  NormBN,
  TokenInfoType,
  WalletTokenInfo,
  safeDiff,
} from "@/_common";
import { useCSVData } from "@/_hooks";
import { useConfig } from "@/_provider/configProvider";
import BigNumber from "bignumber.js";
import _, { find, first, isEmpty, keys, negate, noop } from "lodash";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Address, getAddress } from "viem";
import { MoralisApi, getMoralisChain, useMoralis } from "./moralisProvider";
import { useServiceApi } from "./serviceProvider";
import { db } from "@/_db/db";

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

type WalletTokenInfoInput = Omit<
  WalletTokenInfo,
  "explorerBalance" | "serviceBalance" | "diffBalance" | "virtual" | "type"
> & {
  explorerBalance: string;
  serviceBalance: string;
  virtual: "TRUE" | "FALSE";
};

const WalletTokenInfoProvider = ({
  children,
}: ComponentProps<WalletTokenInfoApi>) => {
  const { walletsFile } = useConfig();
  const { moralis } = useMoralis();
  const { initialized, getBalance } = useServiceApi();

  const [selectedInfo, setSelectedInfo] = useState<
    WalletTokenInfo | undefined
  >();
  const [infoList, setInfoList] = useState<WalletTokenInfo[] | undefined>();

  const { data } = useCSVData<WalletTokenInfoInput>({
    fileName: walletsFile,
  });

  const normalizedData: WalletTokenInfo[] | undefined = useMemo(
    () =>
      initialized
        ? data
            ?.filter(({ name }) => !!name)
            .map((w) => {
              const explorerBalance = NormBN(w.explorerBalance || 0, 4);
              const serviceBalance = NormBN(w.serviceBalance, 4);
              const diffBalance = safeDiff(explorerBalance, serviceBalance);
              const decimals = Number(w.decimals || 0);

              const info = {
                ...w,
                virtual: w.virtual === "TRUE",
                diffBalance,
                explorerBalance,
                serviceBalance,
                decimals,
                type: (["MATIC", "BNB", "ETH", "BTC", "SOL"].includes(w.symbol)
                  ? "native"
                  : "erc20") as TokenInfoType,
              };

              info.serviceCalcBalance = NormBN(getBalance(info), 4);

              return info;
            })
        : undefined,
    [data, getBalance, initialized]
  );

  const updateInfos = useCallback((infos: WalletTokenInfo[], store = false) => {
    setInfoList(infos);
    setSelectedInfo(first(infos));
    if (store) {
      db.storeWalletInfos(infos);
    }
  }, []);

  useEffect(() => {
    if (!normalizedData) {
      return;
    }

    const fetchBalances = async () => {
      if (!normalizedData || !moralis) {
        return;
      }

      let infos = await db.loadWalletInfos();
      if (!infos.length) {
        updateInfos(await setBalances(moralis, normalizedData), true);
      } else {
        updateInfos(infos);
      }
    };

    fetchBalances();
  }, [moralis, normalizedData, updateInfos]);

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

type Identity = Pick<
  WalletTokenInfo,
  "walletAddress" | "tokenAddress" | "type" | "chain"
>;

type Balance = Identity & {
  amount: BigNumber;
};

const isBalanceEq = (a: Identity, b: Identity): boolean => {
  if (a.type !== b.type || a.chain !== b.chain) return false;

  if (a.type === "native") {
    return a.walletAddress.toLowerCase() === b.walletAddress.toLowerCase();
  }

  return (
    a.walletAddress.toLowerCase() === b.walletAddress.toLowerCase() &&
    a.tokenAddress?.toLowerCase() === b.tokenAddress?.toLowerCase()
  );
};

const setBalances = async (
  moralis: MoralisApi,
  input: WalletTokenInfo[]
): Promise<WalletTokenInfo[]> => {
  const result = input;
  const chains = _(input).map("chain").uniq().value();

  // async for to fetch erc20 balances
  for await (const chain of chains) {
    const balances = await fetchBalancesForChain(moralis, chain, input);

    balances.forEach((balance) => {
      const info = find(result, (searchInfo) =>
        isBalanceEq(balance, searchInfo)
      );
      if (info) {
        info.explorerBalance = balance.amount;
        info.diffBalance = safeDiff(
          info.explorerBalance,
          info.serviceBalance
        );
      }
    });
  }

  return result;
};

const fetchBalancesForChain = async (
  moralis: MoralisApi,
  chain: Chain,
  input: WalletTokenInfo[]
): Promise<Balance[]> => {
  const mChain = getMoralisChain(chain);
  if (!mChain) return [];

  const byAddress = _(input).filter({ chain }).groupBy("walletAddress").value();
  const balances: Balance[] = [];
  for await (const [walletAddress, infos] of Object.entries(byAddress)) {
    const tokenAddressesCollection = _(infos)
      .map("tokenAddress")
      .filter(negate(isEmpty));
    if (tokenAddressesCollection.isEmpty()) continue;

    const tokenAddresses = tokenAddressesCollection.value() as Address[];

    const response = await moralis.EvmApi.token.getWalletTokenBalances({
      address: walletAddress,
      chain: mChain,
      tokenAddresses,
    });

    response.result.forEach((balance) => {
      if (balance.token?.contractAddress) {
        balances.push({
          walletAddress: getAddress(walletAddress),
          tokenAddress: getAddress(balance.token?.contractAddress.checksum),
          amount: NormBN(balance.value, 4),
          type: "erc20",
          chain,
        });
      }
    });
  }

  const walletAddresses = keys(byAddress);

  const nativeResponse =
    await moralis.EvmApi.balance.getNativeBalancesForAddresses({
      walletAddresses,
      chain: mChain,
    });

  nativeResponse.result[0].walletBalances.forEach((balance) => {
    const srcAmount = BigDecimal(balance.balance.toJSON(), 18);
    balances.push({
      walletAddress: getAddress(balance.address.checksum),
      amount: NormBN(srcAmount, 4),
      type: "native",
      chain,
    });
  });

  return balances;
};
