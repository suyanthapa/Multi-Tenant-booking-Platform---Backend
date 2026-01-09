/*
  Warnings:

  - You are about to drop the `businesses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `resources` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `business_name` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_business_id_fkey";

-- DropForeignKey
ALTER TABLE "resources" DROP CONSTRAINT "resources_business_id_fkey";

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "business_name" TEXT NOT NULL;

-- DropTable
DROP TABLE "businesses";

-- DropTable
DROP TABLE "resources";

-- DropEnum
DROP TYPE "BusinessType";

-- DropEnum
DROP TYPE "ResourceType";

-- CreateIndex
CREATE INDEX "bookings_business_id_idx" ON "bookings"("business_id");
