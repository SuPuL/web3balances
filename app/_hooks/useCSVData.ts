import Papa from "papaparse";
import { useState, useEffect, useMemo } from "react";

export interface CSVDataProps {
  fileName: string;
}

export const useCSVData = <T>({ fileName }: CSVDataProps) => {
  const [data, setData] = useState<T[] | undefined>(undefined);

  useEffect(() => {
    if (!fileName) return;

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
  }, [fileName]);

  return useMemo(
    () => ({
      data,
    }),
    [data]
  );
};
