import { Entry } from "../types";

export interface Transformer<T = any, I = any> {
  transform: (address: string, transactions: T[], internals: I[]) => Entry[];
}

export type Transaction = {};
