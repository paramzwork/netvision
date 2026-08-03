import { fetchInOutOctets, parseInterfaces, snmpWalk, toMap } from "@/lib/snmp";
import { counter64ToNumber } from "@/lib/utils";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { NextResponse } from "next/server";
import { OIDS } from "@/lib/oid";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});
export async function pollTraffic(host: string, community: string) {
  const config = {
    host,
    community,
  };
  const device = await prisma.devices.findUnique({
    where: {
      ipAddress: host,
    },
    select: {
      id: true,
    },
  });
  if (!device) {
    return NextResponse.json({ message: "Device not found." }, { status: 404 });
  }

  const dbInterfaces = await prisma.interfaces.findMany({
    where: {
      deviceId: device.id,
    },
    select: {
      id: true,
      index: true,
    },
  });
  const interfaceIdMap = new Map(
    dbInterfaces.map((iface) => [iface.index, iface.id]),
  );
  const [names, inOctets, outOctets, inErrors, outErrors] = await Promise.all([
    snmpWalk(config, OIDS.ifDescr),
    snmpWalk(config, OIDS.ifHCInOctets),
    snmpWalk(config, OIDS.ifHCOutOctets),
    snmpWalk(config, OIDS.ifInErrors),
    snmpWalk(config, OIDS.ifOutErrors),
  ]);
  const interfaces = parseInterfaces(names);

  const inOctetsMap = toMap(inOctets, (v) => counter64ToNumber(v as Buffer));

  const outOctetsMap = toMap(outOctets, (v) => counter64ToNumber(v as Buffer));
  console.log("IN OCTETS SAMPLE:", inOctets.slice(0, 5));
  console.log("OUT OCTETS SAMPLE:", outOctets.slice(0, 5));

  const inErrorsMap = toMap(inErrors, (v) => Number(v));
  const outErrorsMap = toMap(outErrors, (v) => Number(v));
  const result = fetchInOutOctets(
    interfaces,
    interfaceIdMap,
    inOctetsMap,
    outOctetsMap,
    inErrorsMap,
    outErrorsMap,
  );

  return result;
}
