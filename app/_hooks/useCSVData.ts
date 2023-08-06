import Papa from "papaparse";
import { useState, useEffect, useMemo } from "react";

export interface CSVDataProps {
  fileName: string;
  enabled?: boolean;
}

export const useCSVData = <T>({ fileName, enabled }: CSVDataProps) => {
  const [data, setData] = useState<T[] | undefined>(undefined);

  useEffect(() => {
    if (!fileName || enabled === false) return;

    Papa.parse<T>(`/${fileName}`, {
      download: true,
      header: true,
      complete: (results) => {
        setData(results.data);
      },
      error: () => {
        console.debug(`File ${fileName} missing?`);
        setData([]);
      },
    });
  }, [fileName, enabled]);

  return useMemo(
    () => ({
      data,
    }),
    [data]
  );
};
