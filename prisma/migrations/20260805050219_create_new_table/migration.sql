-- CreateTable
CREATE TABLE "interface_links" (
    "id" SERIAL NOT NULL,
    "bandwidthMbps" INTEGER,
    "status" TEXT,
    "sourceInterfaceId" INTEGER NOT NULL,
    "targetInterfaceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interface_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topology_positions" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "topology_positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "topology_positions_deviceId_key" ON "topology_positions"("deviceId");

-- AddForeignKey
ALTER TABLE "interface_links" ADD CONSTRAINT "interface_links_sourceInterfaceId_fkey" FOREIGN KEY ("sourceInterfaceId") REFERENCES "interfaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interface_links" ADD CONSTRAINT "interface_links_targetInterfaceId_fkey" FOREIGN KEY ("targetInterfaceId") REFERENCES "interfaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topology_positions" ADD CONSTRAINT "topology_positions_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
