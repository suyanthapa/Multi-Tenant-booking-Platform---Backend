/*
  Warnings:

  - You are about to drop the column `isActive` on the `businesses` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED');

-- DropIndex
DROP INDEX "businesses_isActive_idx";

-- AlterTable
ALTER TABLE "businesses" DROP COLUMN "isActive",
ADD COLUMN     "status" "BusinessStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "businesses_status_idx" ON "businesses"("status");
