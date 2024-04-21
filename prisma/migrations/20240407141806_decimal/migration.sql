-- AlterTable
ALTER TABLE `BlockpitTransaction` MODIFY `outgoingAsset` VARCHAR(191) NULL,
    MODIFY `outgoingAmount` DECIMAL(65, 30) NULL,
    MODIFY `incomingAsset` VARCHAR(191) NULL,
    MODIFY `incomingAmount` DECIMAL(65, 30) NULL,
    MODIFY `feeAsset` VARCHAR(191) NULL,
    MODIFY `feeAmount` DECIMAL(65, 30) NULL;
