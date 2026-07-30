-- CreateTable
CREATE TABLE "devices" (
    "id" SERIAL NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "hostname" TEXT,
    "vendor" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "macAddress" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Online',
    "sysName" TEXT NOT NULL,
    "sysDescr" TEXT NOT NULL,
    "sysContact" TEXT,
    "sysLocation" TEXT,
    "sysObjectID" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "devices_ipAddress_key" ON "devices"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "devices_serialNumber_key" ON "devices"("serialNumber");
