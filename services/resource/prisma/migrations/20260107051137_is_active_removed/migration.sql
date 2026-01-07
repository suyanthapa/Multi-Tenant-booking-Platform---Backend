/*
  Warnings:

  - You are about to drop the column `isActive` on the `resources` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "resources_isActive_idx";

-- AlterTable
ALTER TABLE "resources" DROP COLUMN "isActive";

-- CreateIndex
CREATE INDEX "resources_status_idx" ON "resources"("status");
