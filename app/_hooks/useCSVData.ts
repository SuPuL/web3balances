import Papa, { ParseRemoteConfig } from "papaparse";
import { useState, useEffect, useMemo, useCallback } from "react";
import { ActivatedProps } from "./types";
import { filter } from "lodash";

export type CSVDataProps<T> = {
  fileName: string;
  parseConfig?: Partial<ParseRemoteConfig<T>>;
  enabled?: boolean;
};

export type CSVData<T> = Record<string, T[]>;

export const useCSVData = <T>(config: CSVDataProps<T>) => {
  const { data, reload } = useCSVDatas([config]);

  console.info("useCSVData", data, config);

  return useMemo(
    () => ({
      data: data?.[config.fileName],
      reload,
    }),
    [data, reload, config]
  );
};

export const useCSVDatas = <T>(configs: CSVDataProps<T>[]) => {
  const [data, setData] = useState<CSVData<T> | undefined>(undefined);

  const enabledConfigs = useMemo(
    () =>
      configs
        .filter((entry) => entry.enabled !== false && !!entry.fileName)
        .filter((entry) => !data?.[entry.fileName]),
    [configs, data]
  );

  const fetchAll = useCallback(() => {
    enabledConfigs.map(({ fileName, parseConfig }) => {
      Papa.parse<T>(`/${fileName}`, {
        download: true,
        header: true,
        ...parseConfig,
        complete: (results) => {
          setData((data) => ({
            ...data,
            [fileName]: results.data,
          }));
        },
        error: () => {
          console.debug(`File ${fileName} missing?`);
          setData((data) => ({
            ...data,
            [fileName]: [],
          }));
        },
      });
    });
  }, [enabledConfigs]);

  useEffect(() => {
    if (enabledConfigs.length === 0) return;
    console.info("useCSVDatas", enabledConfigs);
    fetchAll();
  }, [fetchAll, enabledConfigs]);

  const reload = useCallback(() => {
    setData(undefined);
  }, []);

  return useMemo(
    () => ({
      data,
      reload,
    }),
    [data, reload]
  );
};
