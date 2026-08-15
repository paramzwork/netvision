/*
  Warnings:

  - Added the required column `sourceHandle` to the `interface_links` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetHandle` to the `interface_links` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "interface_links" ADD COLUMN     "sourceHandle" TEXT NOT NULL,
ADD COLUMN     "targetHandle" TEXT NOT NULL;
