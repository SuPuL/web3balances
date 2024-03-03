There are several tools like [CoinTracker](https://www.cointracker.io/), [Accointing](https://www.accointing.com/), or [Koinly](https://koinly.io/) to track tax-relevant information for Crypto transactions.

But in my experience, you will always need help with these tools and exceptional cases or exotic contracts. Or even with unsupported chains and so force. These may lead to inappropriate transaction tracking or differences in balances in your wallets and the tax tools.

So, I started to build this project as a helper to compare the tax tool-reported transactions with the real world.

Atm [Accointing](https://www.accointing.com/) is supported, and you need a Moralis account. Besides, you must do several manual steps to use this app.

## Preconditions

There are a few manual steps that have to be done. This will be changed in the future.

1. Fill the `wallet.csv` in the public folder with all the wallets you want to compare.
2. Export all transactions from your `accointing.csv` or export from all other tax tools and transform these into the accointing format.
3. Now, we need all transactions for your wallets. Unfortunately, this is a manual process for each chain and wallet (it will be changed to automatic download once wallets can be configured in the app). Create a folder for each wallet named by the wallet address. Now, download this wallet's `transactions` and `internal_transactions` from the chain-based scanner (like Etherscan). The files should have this name pattern `{walletAddress}/{chain}_transactions.csv` and `{walletAddress}/{chain}_internalTransactions.csv`.
4. Prepare the environment:

Copy `cp _env_example .env` and replace the content with your configuration where

- `NEXT_PUBLIC_CHAIN_HISTORY_CSV`: Pattern for wallet transactions
- `NEXT_PUBLIC_CHAIN_HISTORY_INTERNAL_CSV`: Pattern for wallet internal transactions
- `NEXT_PUBLIC_BLOCKPIT_CSV_FOLDER`: Folder containing all blockpit export files
- `NEXT_PUBLIC_WALLETS_CSV`: All your wallet configurations

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Now you start comparing the transactions and see miss matches.

## Next steps

1. Add wallet management UI to avoid `wallet.csv` usage.
2. Automatic import of all transactions from the chain (avoid manual export from scanner).
3. Create own tax format or provide transformation processes for other tax tools than BlockPit.
4. Stop using csv as database.
5. Add guides on how to use the tool.
6. Add graphs to visualize the token balance progress over time.
