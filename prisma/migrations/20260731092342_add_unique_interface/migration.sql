/*
  Warnings:

  - A unique constraint covering the columns `[deviceId,index]` on the table `interfaces` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "interfaces_deviceId_index_key" ON "interfaces"("deviceId", "index");
