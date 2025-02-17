import { Command, Option } from "@commander-js/extra-typings";
import { importBlockpit } from "./actions/blockpit";
import { compareEntries } from "./actions/compareEntries";
import {
  ProcessingType,
  ProcessingTypes,
  importEntries,
} from "./actions/entry";
import { importERC20 } from "./actions/erc20";
import { importNativeToken } from "./actions/nativeToken";
import { importWalletStats } from "./actions/walletStats";
import { importCSVWallets } from "./actions/wallets";

const program = new Command();

const MoralisOption = new Option(
  "-m, --moralisApiKey <moralisApiKey>",
  "Moralis api key"
)
  .env("MORALIS_API_KEY")
  .makeOptionMandatory();

const walletIdsOption = new Option(
  "-w, --walletIds <walletIds>",
  "Wallet IDs to import"
).argParser((val) => val.split(",").map(Number.parseInt));

const fromDateOption = new Option(
  "-d, --fromDate <fromDate>",
  "Start date to import. Previous entries will not be deleted."
).argParser((val) => new Date(val));

const dryRunOption = new Option(
  "-r, --dryRun",
  "Dry run. Do not save data to database."
).default(false);

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
  .command("walletStats")
  .description("Import wallet stats from several sources")
  .addOption(MoralisOption)
  .addOption(walletIdsOption)
  .action(importWalletStats);

program
  .command("erc20")
  .description("Import erc20 transactions from moralis")
  .addOption(MoralisOption)
  .addOption(walletIdsOption)
  .addOption(dryRunOption)
  .addOption(fromDateOption)
  .action(importERC20);

program
  .command("native")
  .description("Import native transactions from moralis")
  .addOption(MoralisOption)
  .addOption(walletIdsOption)
  .addOption(fromDateOption)
  .addOption(dryRunOption)
  .addOption(
    new Option(
      "-i, --importFolder <importFolder>",
      "Import folder path"
    ).default("./etc/data/")
  )
  .action(importNativeToken);

program
  .command("blockpit")
  .description("Import blockpit transactions")
  .addOption(walletIdsOption)
  .addOption(fromDateOption)
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
  .addOption(walletIdsOption)
  .action(importEntries);

program
  .command("compareEntries")
  .description("Compare blockpit and chain transactions.")
  .addOption(walletIdsOption)
  .action(compareEntries);

program.parseAsync();
