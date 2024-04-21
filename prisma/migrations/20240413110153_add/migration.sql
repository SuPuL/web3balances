/*
  Warnings:

  - Added the required column `type` to the `Entry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `EntryComparison` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Entry` ADD COLUMN `type` ENUM('SERVICE', 'NATIVE', 'ERC20') NOT NULL;

-- AlterTable
ALTER TABLE `EntryComparison` ADD COLUMN `type` ENUM('SERVICE', 'NATIVE', 'ERC20') NOT NULL;
