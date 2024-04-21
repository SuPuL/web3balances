import { CellProps } from "@blueprintjs/table";
import Decimal from "decimal.js";

export type EntryType = "NATIVE" | "ERC20" | "SERVICE";

export interface Entry {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  type: EntryType;
  walletId: number;
  date: Date;
  balance: Decimal;
  feePerDay: Decimal;
  valuePerDay: Decimal;
  value: Decimal;
  fee: Decimal;
  tx: string;
  method: string;
  ignored: boolean;
}

export interface CompareEntry extends Entry {
  CompBalance: Decimal;
  CompFeePerDay: Decimal;
  CompValuePerDay: Decimal;
  CompFee: Decimal;
  CompValue: Decimal;
  DiffBalance: Decimal;
  DiffFeePerDay: Decimal;
  DiffValuePerDay: Decimal;
  DiffFee: Decimal;
  DiffValue: Decimal;
  Compare?: Entry[];
}

export type BaseProps = { id: number };

export type ComponentProps<T extends Record<string, unknown> = {}> = {
  children: React.ReactNode;
} & T;

export const Chains = [
  "ETH",
  "BNB",
  "MATIC",
  "SOLANA",
  "ARBITRUM",
  "ARBITRUM_NOVA",
  "ARBITRUM_ONE",
  "OPTIMISM",
] as const;
export type Chain = (typeof Chains)[number];

export type HeaderName<T extends object = object> = Extract<keyof T, string>;

export type Headers<T extends object = object> = HeaderName<T>[];

export type CellRenderer<T extends object = object, H extends object = T> = (
  entries: T[],
  rowIndex: number,
  columnName: HeaderName<H>
) => React.ReactElement<CellProps> | undefined;

export type Wallet = {
  id: number;
  name: string;
  chain: Chain;
  walletAddress: string;
};

export type TokenInfoType = "ERC20" | "NATIVE";

export interface WalletTokenInfo extends Wallet {
  onChainBalance: Decimal;
  onChainBalanceLocal: Decimal;
  onChainBalanceDiff: Decimal;
  serviceBalance: Decimal;
  serviceBalanceLocal: Decimal;
  serviceBalanceDiff: Decimal;
  balanceDiff: Decimal;
  balanceCheckDiff: Decimal;
  decimals: number;
  symbol: string;
  type: TokenInfoType;
  virtual: boolean;
  tokenAddress?: string;
  selected?: boolean;
}
