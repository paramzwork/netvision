/*
  Warnings:

  - Added the required column `height` to the `topology_positions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `topology_positions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `width` to the `topology_positions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "topology_positions" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "height" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "width" DOUBLE PRECISION NOT NULL;
