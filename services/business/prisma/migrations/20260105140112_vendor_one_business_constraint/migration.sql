/*
  Warnings:

  - A unique constraint covering the columns `[owner_id]` on the table `businesses` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "businesses_owner_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "businesses_owner_id_key" ON "businesses"("owner_id");
