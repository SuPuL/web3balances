/*
  Warnings:

  - Added the required column `diffBalance` to the `Wallet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceCalcBalance` to the `Wallet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Wallet` ADD COLUMN `diffBalance` VARCHAR(191) NOT NULL,
    ADD COLUMN `serviceCalcBalance` VARCHAR(191) NOT NULL,
    MODIFY `chain` ENUM('BNB', 'ETH', 'MATIC', 'SOLANA', 'ARBITRUM', 'OPTIMISM') NOT NULL;

-- CreateTable
CREATE TABLE `MoalisErc20Transaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `chain` ENUM('BNB', 'ETH', 'MATIC', 'SOLANA', 'ARBITRUM', 'OPTIMISM') NOT NULL,
    `transactionHash` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `blockTimestamp` DATETIME(3) NOT NULL,
    `blockNumber` DECIMAL(65, 30) NOT NULL,
    `blockHash` VARCHAR(191) NOT NULL,
    `toAddress` VARCHAR(191) NOT NULL,
    `fromAddress` VARCHAR(191) NOT NULL,
    `value` DECIMAL(65, 30) NOT NULL,
    `transactionIndex` INTEGER NOT NULL,
    `logIndex` INTEGER NOT NULL,
    `possibleSpam` BOOLEAN NOT NULL,
    `walletId` INTEGER NOT NULL,

    INDEX `MoalisErc20Transaction_transactionHash_idx`(`transactionHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlockpitTransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `blockpitId` VARCHAR(191) NOT NULL,
    `timestamp` VARCHAR(191) NOT NULL,
    `sourceType` VARCHAR(191) NOT NULL,
    `sourceName` VARCHAR(191) NOT NULL,
    `integration` VARCHAR(191) NOT NULL,
    `transactionType` VARCHAR(191) NOT NULL,
    `outgoingAsset` VARCHAR(191) NOT NULL,
    `outgoingAmount` INTEGER NOT NULL,
    `incomingAsset` VARCHAR(191) NOT NULL,
    `incomingAmount` INTEGER NOT NULL,
    `feeAsset` VARCHAR(191) NOT NULL,
    `feeAmount` INTEGER NOT NULL,
    `transactionId` VARCHAR(191) NOT NULL,
    `note` VARCHAR(191) NOT NULL,
    `mergeId` VARCHAR(191) NOT NULL,
    `excluded` BOOLEAN NOT NULL,
    `ignore` BOOLEAN NOT NULL,
    `walletId` INTEGER NOT NULL,

    INDEX `BlockpitTransaction_transactionId_idx`(`transactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScannerTransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `chain` ENUM('BNB', 'ETH', 'MATIC', 'SOLANA', 'ARBITRUM', 'OPTIMISM') NOT NULL,
    `blockno` VARCHAR(191) NOT NULL,
    `contractAddress` VARCHAR(191) NOT NULL,
    `currentValue` VARCHAR(191) NOT NULL,
    `dateTime` VARCHAR(191) NOT NULL,
    `errCode` VARCHAR(191) NOT NULL,
    `from` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `txhash` VARCHAR(191) NOT NULL,
    `unixTimestamp` VARCHAR(191) NOT NULL,
    `historical` VARCHAR(191) NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `zo` VARCHAR(191) NOT NULL,
    `txnFeeUsd` VARCHAR(191) NOT NULL,
    `txnFeeNative` VARCHAR(191) NOT NULL,
    `valueInNative` VARCHAR(191) NOT NULL,
    `valueOutNative` VARCHAR(191) NOT NULL,
    `walletId` INTEGER NOT NULL,

    INDEX `ScannerTransaction_txhash_idx`(`txhash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScannerInternalTransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `chain` ENUM('BNB', 'ETH', 'MATIC', 'SOLANA', 'ARBITRUM', 'OPTIMISM') NOT NULL,
    `blockno` VARCHAR(191) NOT NULL,
    `contractAddress` VARCHAR(191) NOT NULL,
    `currentValue` VARCHAR(191) NOT NULL,
    `dateTime` VARCHAR(191) NOT NULL,
    `errCode` VARCHAR(191) NOT NULL,
    `from` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `txhash` VARCHAR(191) NOT NULL,
    `unixTimestamp` VARCHAR(191) NOT NULL,
    `walletId` INTEGER NOT NULL,

    INDEX `ScannerInternalTransaction_txhash_idx`(`txhash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Entry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `chain` ENUM('BNB', 'ETH', 'MATIC', 'SOLANA', 'ARBITRUM', 'OPTIMISM') NOT NULL,
    `walletId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `balance` DECIMAL(65, 30) NOT NULL,
    `feePerDay` DECIMAL(65, 30) NOT NULL,
    `valuePerDay` DECIMAL(65, 30) NOT NULL,
    `value` DECIMAL(65, 30) NOT NULL,
    `fee` DECIMAL(65, 30) NOT NULL,
    `tx` VARCHAR(191) NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `ignored` BOOLEAN NOT NULL,

    INDEX `Entry_tx_idx`(`tx`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EntryComparison` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `chain` ENUM('BNB', 'ETH', 'MATIC', 'SOLANA', 'ARBITRUM', 'OPTIMISM') NOT NULL,
    `walletId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `balance` DECIMAL(65, 30) NOT NULL,
    `feePerDay` DECIMAL(65, 30) NOT NULL,
    `valuePerDay` DECIMAL(65, 30) NOT NULL,
    `value` DECIMAL(65, 30) NOT NULL,
    `fee` DECIMAL(65, 30) NOT NULL,
    `tx` VARCHAR(191) NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `ignored` BOOLEAN NOT NULL,
    `compBalance` DECIMAL(65, 30) NOT NULL,
    `compFeePerDay` DECIMAL(65, 30) NOT NULL,
    `compValuePerDay` DECIMAL(65, 30) NOT NULL,
    `compFee` DECIMAL(65, 30) NOT NULL,
    `compValue` DECIMAL(65, 30) NOT NULL,
    `diffBalance` DECIMAL(65, 30) NOT NULL,
    `diffFeePerDay` DECIMAL(65, 30) NOT NULL,
    `diffValuePerDay` DECIMAL(65, 30) NOT NULL,
    `diffFee` DECIMAL(65, 30) NOT NULL,
    `diffValue` DECIMAL(65, 30) NOT NULL,

    INDEX `EntryComparison_tx_idx`(`tx`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MoalisErc20Transaction` ADD CONSTRAINT `MoalisErc20Transaction_walletId_fkey` FOREIGN KEY (`walletId`) REFERENCES `Wallet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BlockpitTransaction` ADD CONSTRAINT `BlockpitTransaction_walletId_fkey` FOREIGN KEY (`walletId`) REFERENCES `Wallet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScannerTransaction` ADD CONSTRAINT `ScannerTransaction_walletId_fkey` FOREIGN KEY (`walletId`) REFERENCES `Wallet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScannerInternalTransaction` ADD CONSTRAINT `ScannerInternalTransaction_walletId_fkey` FOREIGN KEY (`walletId`) REFERENCES `Wallet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Entry` ADD CONSTRAINT `Entry_walletId_fkey` FOREIGN KEY (`walletId`) REFERENCES `Wallet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EntryComparison` ADD CONSTRAINT `EntryComparison_walletId_fkey` FOREIGN KEY (`walletId`) REFERENCES `Wallet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
