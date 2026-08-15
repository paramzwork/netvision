/*
  Warnings:

  - You are about to drop the column `deviceId` on the `topology_positions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[interfaceId]` on the table `topology_positions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `interfaceId` to the `topology_positions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "topology_positions" DROP CONSTRAINT "topology_positions_deviceId_fkey";

-- DropIndex
DROP INDEX "topology_positions_deviceId_key";

-- AlterTable
ALTER TABLE "topology_positions" DROP COLUMN "deviceId",
ADD COLUMN     "interfaceId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "topology_positions_interfaceId_key" ON "topology_positions"("interfaceId");

-- AddForeignKey
ALTER TABLE "topology_positions" ADD CONSTRAINT "topology_positions_interfaceId_fkey" FOREIGN KEY ("interfaceId") REFERENCES "interfaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
