-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "is_profile_complete" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "business_settings" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "check_in_time" TEXT,
    "check_out_time" TEXT,
    "opening_hours" JSONB,
    "cancellation_policy" TEXT,
    "cancellation_window_hours" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_settings_business_id_key" ON "business_settings"("business_id");

-- AddForeignKey
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
