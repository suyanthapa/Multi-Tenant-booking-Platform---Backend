/*
  Warnings:

  - Added the required column `vendor_id` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "vendor_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "bookings_vendor_id_idx" ON "bookings"("vendor_id");
