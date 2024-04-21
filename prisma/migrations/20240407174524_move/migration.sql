/*
  Warnings:

  - You are about to drop the `MoalisErc20Transaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ScannerInternalTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ScannerTransaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `MoalisErc20Transaction` DROP FOREIGN KEY `MoalisErc20Transaction_walletId_fkey`;

-- DropForeignKey
ALTER TABLE `ScannerInternalTransaction` DROP FOREIGN KEY `ScannerInternalTransaction_walletId_fkey`;

-- DropForeignKey
ALTER TABLE `ScannerTransaction` DROP FOREIGN KEY `ScannerTransaction_walletId_fkey`;

-- DropTable
DROP TABLE `MoalisErc20Transaction`;

-- DropTable
DROP TABLE `ScannerInternalTransaction`;

-- DropTable
DROP TABLE `ScannerTransaction`;

-- CreateTable
CREATE TABLE `MoralisErc20Transaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `chain` ENUM('BTC', 'BNB', 'ETH', 'MATIC', 'SOLANA', 'ARBITRUM', 'ARBITRUM_NOVA', 'ARBITRUM_ONE', 'OPTIMISM') NOT NULL,
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

    INDEX `MoralisErc20Transaction_transactionHash_idx`(`transactionHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MoralisNativeTransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `chain` ENUM('BTC', 'BNB', 'ETH', 'MATIC', 'SOLANA', 'ARBITRUM', 'ARBITRUM_NOVA', 'ARBITRUM_ONE', 'OPTIMISM') NOT NULL,
    `type` ENUM('TX', 'INTERNAL_TX') NOT NULL,
    `to` VARCHAR(191) NULL,
    `nonce` DECIMAL(65, 30) NULL,
    `hash` VARCHAR(191) NOT NULL,
    `gas` DECIMAL(65, 30) NULL,
    `gasPrice` DECIMAL(65, 30) NOT NULL,
    `index` VARCHAR(191) NOT NULL,
    `blockNumber` DECIMAL(65, 30) NOT NULL,
    `blockHash` VARCHAR(191) NOT NULL,
    `blockTimestamp` DATETIME(3) NOT NULL,
    `cumulativeGasUsed` DECIMAL(65, 30) NOT NULL,
    `gasUsed` DECIMAL(65, 30) NOT NULL,
    `contractAddress` VARCHAR(191) NOT NULL,
    `walletId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MoralisErc20Transaction` ADD CONSTRAINT `MoralisErc20Transaction_walletId_fkey` FOREIGN KEY (`walletId`) REFERENCES `Wallet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MoralisNativeTransaction` ADD CONSTRAINT `MoralisNativeTransaction_walletId_fkey` FOREIGN KEY (`walletId`) REFERENCES `Wallet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
