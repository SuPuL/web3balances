/*
  Warnings:

  - Added the required column `fee` to the `MoralisNativeTransaction` table without a default value. This is not possible if the table is not empty.
  - Made the column `from` on table `MoralisNativeTransaction` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `MoralisNativeTransaction` ADD COLUMN `fee` DECIMAL(65, 30) NOT NULL,
    ADD COLUMN `value` DECIMAL(65, 30) NULL,
    MODIFY `from` VARCHAR(191) NOT NULL;
