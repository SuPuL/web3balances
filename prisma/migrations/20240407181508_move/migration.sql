/*
  Warnings:

  - You are about to drop the column `hash` on the `MoralisNativeTransaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `MoralisNativeTransaction` DROP COLUMN `hash`,
    MODIFY `transactionHash` VARCHAR(191) NULL;
