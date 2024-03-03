import Papa, { ParseRemoteConfig } from "papaparse";
import { useState, useEffect, useMemo } from "react";

export interface CSVDataProps<T> {
  fileName: string;
  enabled?: boolean;
  parseConfig?: Partial<ParseRemoteConfig<T>>;
}

export const useCSVData = <T>({
  fileName,
  enabled,
  parseConfig,
}: CSVDataProps<T>) => {
  const [data, setData] = useState<T[] | undefined>(undefined);

  useEffect(() => {
    if (!fileName || enabled === false) return;

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
    });
  }, [fileName, enabled, parseConfig]);

  return useMemo(
    () => ({
      data,
    }),
    [data]
  );
};
