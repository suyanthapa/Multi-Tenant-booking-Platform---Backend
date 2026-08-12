-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "completed_steps" JSONB NOT NULL DEFAULT '{}';
