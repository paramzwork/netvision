/*
  Warnings:

  - Added the required column `height` to the `topology_nodes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `width` to the `topology_nodes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "topology_nodes" ADD COLUMN     "height" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "width" DOUBLE PRECISION NOT NULL;
