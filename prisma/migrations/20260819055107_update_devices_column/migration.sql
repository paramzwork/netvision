/*
  Warnings:

  - You are about to drop the column `hostname` on the `devices` table. All the data in the column will be lost.
  - You are about to drop the column `macAddress` on the `devices` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `devices` table. All the data in the column will be lost.
  - You are about to drop the column `vendor` on the `devices` table. All the data in the column will be lost.
  - Made the column `updatedAt` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "devices" DROP COLUMN "hostname",
DROP COLUMN "macAddress",
DROP COLUMN "model",
DROP COLUMN "vendor";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
