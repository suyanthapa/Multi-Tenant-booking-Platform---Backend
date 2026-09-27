/*
  Warnings:

  - You are about to drop the column `currency` on the `resources` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `resources` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `resources` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `resources` table. All the data in the column will be lost.
  - You are about to drop the `ResourceCategory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "category_images" DROP CONSTRAINT "category_images_category_id_fkey";

-- DropForeignKey
ALTER TABLE "resources" DROP CONSTRAINT "resources_category_id_fkey";

-- AlterTable
ALTER TABLE "resources" DROP COLUMN "currency",
DROP COLUMN "description",
DROP COLUMN "metadata",
DROP COLUMN "price";

-- DropTable
DROP TABLE "ResourceCategory";

-- CreateTable
CREATE TABLE "resource_categories" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "max_guests" INTEGER,
    "amenities" TEXT[],
    "duration_minutes" INTEGER,
    "specialization" TEXT,

    CONSTRAINT "resource_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resource_categories_business_id_name_key" ON "resource_categories"("business_id", "name");

-- CreateIndex
CREATE INDEX "resources_category_id_idx" ON "resources"("category_id");

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "resource_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_images" ADD CONSTRAINT "category_images_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "resource_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
