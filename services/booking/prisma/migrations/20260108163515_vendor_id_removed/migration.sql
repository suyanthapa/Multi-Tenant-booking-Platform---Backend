/*
  Warnings:

  - You are about to drop the column `vendor_id` on the `bookings` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "bookings_vendor_id_idx";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "vendor_id";
