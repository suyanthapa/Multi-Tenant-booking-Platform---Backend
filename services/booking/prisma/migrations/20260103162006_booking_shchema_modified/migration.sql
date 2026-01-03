/*
  Warnings:

  - You are about to drop the column `cancel_reason` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `cancelled_at` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `payment_status` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `service_id` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `total_amount` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `bookings` table. All the data in the column will be lost.
  - Added the required column `price_at_booking` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resource_id` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resource_name` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resource_type` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vendor_name` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "bookings_service_id_idx";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "cancel_reason",
DROP COLUMN "cancelled_at",
DROP COLUMN "created_at",
DROP COLUMN "notes",
DROP COLUMN "payment_status",
DROP COLUMN "service_id",
DROP COLUMN "total_amount",
DROP COLUMN "updated_at",
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "price_at_booking" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "resource_id" TEXT NOT NULL,
ADD COLUMN     "resource_name" TEXT NOT NULL,
ADD COLUMN     "resource_type" TEXT NOT NULL,
ADD COLUMN     "vendor_name" TEXT NOT NULL;

-- DropEnum
DROP TYPE "PaymentStatus";

-- CreateIndex
CREATE INDEX "bookings_resource_id_idx" ON "bookings"("resource_id");

-- CreateIndex
CREATE INDEX "bookings_resource_id_start_time_end_time_idx" ON "bookings"("resource_id", "start_time", "end_time");
