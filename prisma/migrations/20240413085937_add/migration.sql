/*
  Warnings:

  - You are about to drop the column `chain` on the `Entry` table. All the data in the column will be lost.
  - You are about to drop the column `chain` on the `EntryComparison` table. All the data in the column will be lost.
  - You are about to drop the column `diffBalance` on the `Wallet` table. All the data in the column will be lost.
  - You are about to drop the column `explorerBalance` on the `Wallet` table. All the data in the column will be lost.
  - You are about to drop the column `serviceCalcBalance` on the `Wallet` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Entry` DROP COLUMN `chain`;

-- AlterTable
ALTER TABLE `EntryComparison` DROP COLUMN `chain`;

-- AlterTable
ALTER TABLE `Wallet` DROP COLUMN `diffBalance`,
    DROP COLUMN `explorerBalance`,
    DROP COLUMN `serviceCalcBalance`,
    ADD COLUMN `balanceCheckDiff` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `balanceDiff` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `onChainBalance` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `onChainBalanceDiff` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `onChainBalanceLocal` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `serviceBalanceDiff` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `serviceBalanceLocal` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    MODIFY `serviceBalance` DECIMAL(65, 30) NOT NULL DEFAULT 0;
