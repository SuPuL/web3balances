/*
  Warnings:

  - Added the required column `transactionHash` to the `MoralisNativeTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `MoralisNativeTransaction` ADD COLUMN `transactionHash` VARCHAR(191) NOT NULL;
