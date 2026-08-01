-- AlterTable
ALTER TABLE "devices" ALTER COLUMN "status" SET DEFAULT '1';

-- CreateTable
CREATE TABLE "interfaces" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "index" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "adminStatus" INTEGER NOT NULL,
    "operStatus" INTEGER NOT NULL,
    "speedMbps" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "interfaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interface_statistics" (
    "id" SERIAL NOT NULL,
    "interfaceId" INTEGER NOT NULL,
    "inOctets" BIGINT NOT NULL,
    "outOctets" BIGINT NOT NULL,
    "inErrors" BIGINT NOT NULL DEFAULT 0,
    "outErrors" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interface_statistics_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "interfaces" ADD CONSTRAINT "interfaces_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interface_statistics" ADD CONSTRAINT "interface_statistics_interfaceId_fkey" FOREIGN KEY ("interfaceId") REFERENCES "interfaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
