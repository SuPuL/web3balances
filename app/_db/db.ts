import { WalletTokenInfo } from "@/_common";
import { Erc20TransactionData } from "@moralisweb3/common-evm-utils";
import Dexie, { Table } from "dexie";

export class LocalCache extends Dexie {
  wallets!: Table<WalletTokenInfo>;
  erc20Transfers!: Table<Erc20TransactionData>;

  constructor() {
    super("cache");
    this.version(1).stores({
      wallets: "++id, name, walletAddress, tokenAddress, chain",
      erc20Transfers: "++id, address, chain, transactionHash",
    });
  }
}

export const db = new LocalCache();
