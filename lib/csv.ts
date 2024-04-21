import {
  parse,
  ParseConfig,
  ParseLocalConfig,
  ParseRemoteConfig,
  ParseResult,
} from "papaparse";
import { createReadStream } from "fs";

export const parseCsvByPath = <T>(
  path: string,
  options: Omit<ParseLocalConfig<T>, "complete" | "error">
): Promise<ParseResult<T>> =>
  new Promise((resolve, reject) => {
    parse(createReadStream(path), {
      ...options,
      complete: (results) => resolve(results),
      error: (error) => reject(error),
    });
  });

export const parseCsvByUrl = <T>(
  url: string,
  options: Omit<ParseRemoteConfig<T>, "complete" | "error">
): Promise<ParseResult<T>> =>
  new Promise((resolve, reject) => {
    parse(url, {
      ...options,
      complete: (results) => resolve(results),
      error: (error) => reject(error),
    });
  });

export const parseCsvData = <T>(
  data: string,
  options: Omit<ParseConfig<T>, "complete" | "error">
): Promise<ParseResult<T>> =>
  new Promise((resolve, reject) => {
    parse(data, {
      ...options,
      complete: (results) => resolve(results),
      error: (error: any) => reject(error),
    });
  });
