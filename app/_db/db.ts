import { Chain, TokenInfoType, WalletTokenInfo } from "@/_common";
import { Erc20TransactionInput } from "@moralisweb3/common-evm-utils";
import BigNumber from "bignumber.js";
import Dexie, { Table } from "dexie";
import { Address } from "viem";

type IWalletTokenInfoEntity = Omit<
  WalletTokenInfo,
  | "explorerBalance"
  | "accointingBalance"
  | "accointingCalcBalance"
  | "diffBalance"
> & {
  explorerBalance: string;
  accointingBalance: string;
  accointingCalcBalance: string;
  diffBalance: string;
};

export class WalletTokenInfoEntity implements IWalletTokenInfoEntity {
  constructor(
    public id: number,
    public name: string,
    public chain: Chain,
    public explorerBalance: string,
    public accointingBalance: string,
    public accointingCalcBalance: string,
    public diffBalance: string,
    public symbol: string,
    public decimals: number,
    public type: TokenInfoType,
    public virtual: boolean,
    public walletAddress: Address,
    public tokenAddress?: Address
  ) {}
}

export class LocalCache extends Dexie {
  wallets!: Table<IWalletTokenInfoEntity>;
  erc20Transfers!: Table<Erc20TransactionInput>;

  constructor() {
    super("cache");
    this.version(1).stores({
      wallets: "++id, name, chain",
      erc20Transfers:
        "++id, address, chain, transactionHash, toAddress, fromAddress, virtual, tokenSymbol",
    });
    this.wallets.mapToClass(WalletTokenInfoEntity);
  }

  // stupid methods for serialization there must be a better solution in dexie.js
  storeWalletInfos = async (infos: WalletTokenInfo[]) => {
    const entities: IWalletTokenInfoEntity[] = infos.map((info) => {
      return {
        ...info,
        explorerBalance: info.explorerBalance.toJSON(),
        accointingBalance: info.accointingBalance.toJSON(),
        accointingCalcBalance: info.accointingCalcBalance.toJSON(),
        diffBalance: info.diffBalance.toJSON(),
      };
    });

    return this.wallets.bulkAdd(entities);
  };

  // stupid methods for serialization there must be a better solution in dexie.js
  loadWalletInfos = async (): Promise<WalletTokenInfo[]> => {
    const wallets = await this.wallets.toArray();

    return wallets.map((wallet) => {
      return {
        ...wallet,
        explorerBalance: new BigNumber(wallet.explorerBalance),
        accointingBalance: new BigNumber(wallet.accointingBalance),
        accointingCalcBalance: new BigNumber(wallet.accointingCalcBalance),
        diffBalance: new BigNumber(wallet.diffBalance),
      };
    });
  };
}

export const db = new LocalCache();
