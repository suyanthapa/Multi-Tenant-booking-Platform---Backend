-- AlterTable
ALTER TABLE "resources" ADD COLUMN     "category_id" TEXT,
ADD COLUMN     "metadata" JSONB DEFAULT '{}';

-- CreateTable
CREATE TABLE "ResourceCategory" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ResourceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResourceCategory_business_id_name_key" ON "ResourceCategory"("business_id", "name");

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ResourceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
