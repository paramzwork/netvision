/*
  Warnings:

  - Made the column `role` on table `roles` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "roles" ALTER COLUMN "role" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "updatedAt" DROP NOT NULL;
