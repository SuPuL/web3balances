import { Command, Option } from "@commander-js/extra-typings";
import { importCSVWallets } from "./actions/wallets";
import { importERC20 } from "./actions/erc20";
import { importBlockpit } from "./actions/blockpit";
import { importNativeToken } from "./actions/nativeToken";
import {
  ProcessingType,
  ProcessingTypes,
  importEntries,
} from "./actions/entry";

const program = new Command();

program
  .name("import")
  .description(
    "CLI to import balance data from several sources (CSV, BLockpit, moralis, chain explorers etc.)"
  )
  .version("0.0.1");

program
  .command("wallets")
  .description("Import wallets from a CSV file")
  .argument("[string]", "path to csv file", "./etc/data/wallets.csv")
  .action(importCSVWallets);

program
  .command("erc20")
  .description("Import erc20 transactions from moralis")
  .addOption(
    new Option("-m, --moralisApiKey <moralisApiKey>", "Moralis api key")
      .env("MORALIS_API_KEY")
      .makeOptionMandatory()
  )
  .action(importERC20);

program
  .command("native")
  .description("Import native transactions from moralis")
  .addOption(
    new Option("-m, --moralisApiKey <moralisApiKey>", "Moralis api key")
      .env("MORALIS_API_KEY")
      .makeOptionMandatory()
  )
  .action(importNativeToken);

program
  .command("blockpit")
  .description("Import blockpit transactions")
  .addOption(
    new Option("-b, --bearerToken <bearerToken>", "Blockpit bearer token")
      .env("BLOCKPIT_BEARER")
      .makeOptionMandatory()
  )
  .action(importBlockpit);

program
  .command("entry")
  .description("Create entries by defined source")
  .addOption(
    new Option("-t, --types <types>", "Type to import")
      .argParser(
        (val) =>
          val
            .split(",")
            .filter((type) =>
              ProcessingTypes.includes(type as any)
            ) as ProcessingType[]
      )
      .default(ProcessingTypes)
      .makeOptionMandatory()
  )
  .addOption(
    new Option("-w, --walletIds <walletIds>", "Wallet IDs to import").argParser(
      (val) => val.split(",").map(Number.parseInt)
    )
  )
  .action(importEntries);

program.parseAsync();
