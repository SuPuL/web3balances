import { Entry, WalletTokenInfo } from "@/_common";
import { useAccointingApi } from "@/_provider/accointingProvider";
import { useMemo } from "react";

export interface AccointingDataProps {
  info?: WalletTokenInfo;
}

export const useAccointingData = ({
  info,
}: AccointingDataProps): { data: Entry[] | undefined } => {
  const { getEntries, initialized } = useAccointingApi();

  return useMemo(
    () => ({
      data: info && initialized ? getEntries(info) : undefined,
    }),
    [initialized, getEntries, info]
  );
};
