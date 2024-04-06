-- CreateTable
CREATE TABLE `Wallet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `chain` ENUM('BNB', 'ETH', 'MATIC', 'SOLANA') NOT NULL,
    `walletAddress` VARCHAR(191) NOT NULL,
    `explorerBalance` VARCHAR(191) NOT NULL,
    `serviceBalance` VARCHAR(191) NOT NULL,
    `decimals` INTEGER NOT NULL,
    `symbol` VARCHAR(191) NOT NULL,
    `type` ENUM('NATIVE', 'ERC20') NOT NULL,
    `virtual` BOOLEAN NOT NULL,
    `tokenAddress` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Wallet_name_key`(`name`),
    INDEX `Wallet_chain_name_walletAddress_idx`(`chain`, `name`, `walletAddress`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
