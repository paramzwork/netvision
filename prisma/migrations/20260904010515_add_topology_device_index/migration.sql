-- DropIndex
DROP INDEX "topology_nodes_deviceId_idx";

-- CreateIndex
CREATE INDEX "topology_nodes_interfaceId_idx" ON "topology_nodes"("interfaceId");
