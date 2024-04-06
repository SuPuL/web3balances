/*
  Warnings:

  - You are about to alter the column `currentValue` on the `ScannerInternalTransaction` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Decimal(65,30)`.
  - You are about to alter the column `currentValue` on the `ScannerTransaction` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Decimal(65,30)`.
  - You are about to alter the column `txnFeeUsd` on the `ScannerTransaction` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Decimal(65,30)`.
  - You are about to alter the column `txnFeeNative` on the `ScannerTransaction` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Decimal(65,30)`.
  - You are about to alter the column `valueInNative` on the `ScannerTransaction` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Decimal(65,30)`.
  - You are about to alter the column `valueOutNative` on the `ScannerTransaction` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Decimal(65,30)`.
  - You are about to alter the column `explorerBalance` on the `Wallet` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Decimal(65,30)`.
  - You are about to alter the column `serviceBalance` on the `Wallet` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Decimal(65,30)`.
  - You are about to alter the column `diffBalance` on the `Wallet` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Decimal(65,30)`.
  - You are about to alter the column `serviceCalcBalance` on the `Wallet` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE `ScannerInternalTransaction` MODIFY `currentValue` DECIMAL(65, 30) NOT NULL;

-- AlterTable
ALTER TABLE `ScannerTransaction` MODIFY `currentValue` DECIMAL(65, 30) NOT NULL,
    MODIFY `txnFeeUsd` DECIMAL(65, 30) NOT NULL,
    MODIFY `txnFeeNative` DECIMAL(65, 30) NOT NULL,
    MODIFY `valueInNative` DECIMAL(65, 30) NOT NULL,
    MODIFY `valueOutNative` DECIMAL(65, 30) NOT NULL;

-- AlterTable
ALTER TABLE `Wallet` MODIFY `explorerBalance` DECIMAL(65, 30) NOT NULL,
    MODIFY `serviceBalance` DECIMAL(65, 30) NOT NULL,
    MODIFY `diffBalance` DECIMAL(65, 30) NOT NULL,
    MODIFY `serviceCalcBalance` DECIMAL(65, 30) NOT NULL;
