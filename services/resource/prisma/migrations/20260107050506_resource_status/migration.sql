-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DELETED');

-- AlterTable
ALTER TABLE "resources" ADD COLUMN     "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE';
