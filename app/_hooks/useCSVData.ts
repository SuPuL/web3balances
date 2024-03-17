import Papa, { ParseRemoteConfig } from "papaparse";
import { useState, useEffect, useMemo, useCallback } from "react";

export interface CSVDataProps<T> {
  fileName: string;
  enabled?: boolean;
  parseConfig?: Partial<ParseRemoteConfig<T>>;
  relaod?: boolean;
}

export const useCSVData = <T>({
  fileName,
  enabled,
  parseConfig,
}: CSVDataProps<T>) => {
  const [data, setData] = useState<T[] | undefined>(undefined);

  const fetch = useCallback(
    () =>
      Papa.parse<T>(`/${fileName}`, {
        download: true,
        header: true,
        ...parseConfig,
        complete: (results) => {
          setData(results.data);
        },
        error: () => {
          console.debug(`File ${fileName} missing?`);
          setData([]);
        },
      }),
    [fileName, parseConfig]
  );

  useEffect(() => {
    if (!fileName || enabled === false) return;

    fetch();
  }, [fileName, enabled, fetch]);

  return useMemo(
    () => ({
      data,
      reload: fetch,
    }),
    [data, fetch]
  );
};
