/*
  Warnings:

  - Made the column `address` on table `businesses` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `businesses` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "businesses" ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL;
