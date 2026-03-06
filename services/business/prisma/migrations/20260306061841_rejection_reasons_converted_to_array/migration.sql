/*
  Warnings:

  - You are about to drop the column `rejection_reason` on the `businesses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "businesses" DROP COLUMN "rejection_reason",
ADD COLUMN     "rejection_reasons" "RejectionReason"[];
