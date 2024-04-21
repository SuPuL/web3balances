/*
  Warnings:

  - You are about to alter the column `outgoingAmount` on the `BlockpitTransaction` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(65,30)`.
  - You are about to alter the column `incomingAmount` on the `BlockpitTransaction` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(65,30)`.
  - You are about to alter the column `feeAmount` on the `BlockpitTransaction` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE `BlockpitTransaction` MODIFY `outgoingAmount` DECIMAL(65, 30) NOT NULL,
    MODIFY `incomingAmount` DECIMAL(65, 30) NOT NULL,
    MODIFY `feeAmount` DECIMAL(65, 30) NOT NULL;
