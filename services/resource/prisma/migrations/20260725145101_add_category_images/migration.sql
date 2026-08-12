-- CreateTable
CREATE TABLE "category_images" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "public_id" TEXT,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "category_images_category_id_idx" ON "category_images"("category_id");

-- AddForeignKey
ALTER TABLE "category_images" ADD CONSTRAINT "category_images_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ResourceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
