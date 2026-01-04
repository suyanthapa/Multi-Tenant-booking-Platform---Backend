/*
  Warnings:

  - You are about to drop the column `vendor_id` on the `resources` table. All the data in the column will be lost.
  - Added the required column `business_id` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `business_id` to the `resources` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('HOTEL', 'CLINIC', 'SALON', 'CO_WORKING', 'OTHER');

-- DropIndex
DROP INDEX "resources_vendor_id_idx";

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "business_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "resources" DROP COLUMN "vendor_id",
ADD COLUMN     "business_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "BusinessType" NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "businesses_owner_id_idx" ON "businesses"("owner_id");

-- CreateIndex
CREATE INDEX "businesses_type_idx" ON "businesses"("type");

-- CreateIndex
CREATE INDEX "resources_business_id_idx" ON "resources"("business_id");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
