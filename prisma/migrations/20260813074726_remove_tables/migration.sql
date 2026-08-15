/*
  Warnings:

  - You are about to drop the `interface_links` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `topology_positions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "interface_links" DROP CONSTRAINT "interface_links_sourceInterfaceId_fkey";

-- DropForeignKey
ALTER TABLE "interface_links" DROP CONSTRAINT "interface_links_targetInterfaceId_fkey";

-- DropForeignKey
ALTER TABLE "topology_positions" DROP CONSTRAINT "topology_positions_interfaceId_fkey";

-- DropTable
DROP TABLE "interface_links";

-- DropTable
DROP TABLE "topology_positions";
