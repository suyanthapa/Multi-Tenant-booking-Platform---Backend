-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('HOTEL_ROOM', 'DOCTOR_SLOT', 'SALON_CHAIR', 'DESK', 'OTHER');

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resources_vendor_id_idx" ON "resources"("vendor_id");

-- CreateIndex
CREATE INDEX "resources_type_idx" ON "resources"("type");
