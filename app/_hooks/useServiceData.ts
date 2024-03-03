import { Entry, WalletTokenInfo } from "@/_common";
import { useServiceApi } from "@/_provider/serviceProvider";
import { useMemo } from "react";

export interface ServiceDataProps {
  info?: WalletTokenInfo;
}

export const useServiceData = ({
  info,
}: ServiceDataProps): { data: Entry[] | undefined } => {
  const { getEntries, initialized } = useServiceApi();

  return useMemo(
    () => ({
      data: info && initialized ? getEntries(info) : undefined,
    }),
    [initialized, getEntries, info]
  );
};
