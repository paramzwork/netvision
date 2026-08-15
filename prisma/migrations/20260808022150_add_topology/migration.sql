-- AlterTable
ALTER TABLE "interface_links" ADD COLUMN     "inboundMbps" DOUBLE PRECISION,
ADD COLUMN     "outboundMbps" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "topologies" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "topologies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topology_nodes" (
    "id" SERIAL NOT NULL,
    "topologyId" INTEGER NOT NULL,
    "nodeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "positionX" DOUBLE PRECISION NOT NULL,
    "positionY" DOUBLE PRECISION NOT NULL,
    "deviceId" INTEGER,
    "interfaceId" INTEGER,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "topology_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topology_edges" (
    "id" SERIAL NOT NULL,
    "topologyId" INTEGER NOT NULL,
    "edgeId" TEXT NOT NULL,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "sourceHandle" TEXT,
    "targetHandle" TEXT,
    "type" TEXT,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "topology_edges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "topology_nodes_topologyId_idx" ON "topology_nodes"("topologyId");

-- CreateIndex
CREATE UNIQUE INDEX "topology_nodes_topologyId_nodeId_key" ON "topology_nodes"("topologyId", "nodeId");

-- CreateIndex
CREATE INDEX "topology_edges_topologyId_idx" ON "topology_edges"("topologyId");

-- CreateIndex
CREATE UNIQUE INDEX "topology_edges_topologyId_edgeId_key" ON "topology_edges"("topologyId", "edgeId");

-- AddForeignKey
ALTER TABLE "topology_nodes" ADD CONSTRAINT "topology_nodes_topologyId_fkey" FOREIGN KEY ("topologyId") REFERENCES "topologies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topology_edges" ADD CONSTRAINT "topology_edges_topologyId_fkey" FOREIGN KEY ("topologyId") REFERENCES "topologies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
