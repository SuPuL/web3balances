import { Entry, WalletTokenInfo } from "@app/_common";
import { useServiceApi } from "@app/_provider/serviceProvider";
import { useMemo } from "react";

export interface ServiceDataProps {
  info?: WalletTokenInfo;
}

export const useServiceData = (
  configs: ServiceDataProps[]
): Record<string, Entry[]> => {
  const { getEntries, initialized } = useServiceApi();

  return useMemo(
    () =>
      configs.reduce((data, { info }) => {
        if (!info || !initialized) return data;

        return {
          ...data,
          [info.chainId]: getEntries(info) || [],
        };
      }, {} as Record<string, Entry[]>),
    [configs, getEntries, initialized]
  );
};
