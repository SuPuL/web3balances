import { PrismaClient } from "@prisma/client";
import Moralis from "moralis";
import { MoralisApi } from "./moralis";

export type DIOptions = Partial<{
  moralisApiKey: string;
}>;

export type DI = {
  chainApi?: MoralisApi;
  db: PrismaClient;
};

let DI: DI | undefined = undefined;

export const initDI = async ({ moralisApiKey: apiKey }: DIOptions) => {
  if (!DI) {
    let chainApi;
    if (apiKey) {
      await Moralis.start({ apiKey });
      chainApi = Moralis;
    }

    DI = {
      chainApi,
      db: new PrismaClient(),
    };
  }

  return DI;
};
