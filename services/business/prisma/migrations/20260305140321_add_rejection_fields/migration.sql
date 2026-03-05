-- CreateEnum
CREATE TYPE "RejectionReason" AS ENUM ('INVALID_DOCUMENTS', 'INCOMPLETE_PROFILE', 'DUPLICATE_ACCOUNT', 'PROHIBITED_CONTENT', 'UNRESPONSIVE', 'OTHER');

-- AlterEnum
ALTER TYPE "BusinessStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "rejected_at" TIMESTAMP(3),
ADD COLUMN     "rejection_reason" "RejectionReason",
ADD COLUMN     "resubmitted" BOOLEAN NOT NULL DEFAULT false;
