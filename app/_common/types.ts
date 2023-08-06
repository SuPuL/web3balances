import { CellProps } from "@blueprintjs/table";
import { Address } from "viem";

export interface Entry<T extends unknown = unknown> {
  timestamp: number;
  Date: string;
  Time: string;
  Balance: number;
  FeePerDay: number;
  ValuePerDay: number;
  Value: number;
  Fee: number;
  Tx: string;
  Method: string;
  ignored?: boolean;
  src: T;
}

export interface CompareEntry<T extends unknown = unknown> extends Entry<T> {
  CompBalance: number;
  CompFeePerDay: number;
  CompValuePerDay: number;
  CompFee: number;
  CompValue: number;
  DiffBalance: number;
  DiffFeePerDay: number;
  DiffValuePerDay: number;
  DiffFee: number;
  DiffValue: number;
  Compare?: Entry[];
}

export type ComponentProps<T extends Record<string, unknown> = {}> = {
  children: React.ReactNode;
} & T;

export const Chains = ["ETH", "BNB", "MATIC", "SOLANA"] as const;
export type Chain = (typeof Chains)[number];

export type HeaderName<T extends object = object> = Extract<keyof T, string>;

export type Headers<T extends object = object> = HeaderName<T>[];

export type CellRenderer<T extends object = object> = (
  entries: T[],
  rowIndex: number,
  columnName: HeaderName<T>
) => React.ReactElement<CellProps> | undefined;

export type Wallet = {
  name: string;
  chain: Chain;
  walletAddress: Address;
};

export type TokenInfoType = "erc20" | "native";

export interface WalletTokenInfo extends Wallet {
  explorerBalance: number;
  accointingBalance: number;
  diffBalance: number;
  currency: string;
  decimals: number;
  type: TokenInfoType;
  address?: Address;
}
