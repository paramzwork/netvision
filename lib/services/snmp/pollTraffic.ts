import { fetchInOutOctets, parseInterfaces, snmpWalk, toMap } from "@/lib/snmp";
import { counter64ToNumber } from "@/lib/utils";
import { OIDS } from "@/lib/oid";
import { prisma } from "@/lib/prisma";

export async function pollTraffic(host: string, community: string) {
  const config = { host, community };

  const device = await prisma.devices.findUnique({
    where: {
      ipAddress: host,
    },
    select: {
      id: true,
    },
  });

  if (!device) {
    throw new Error("Device not found.");
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

  const inErrorsMap = toMap(inErrors, Number);
  const outErrorsMap = toMap(outErrors, Number);

  const statistics = fetchInOutOctets(
    interfaces,
    interfaceIdMap,
    inOctetsMap,
    outOctetsMap,
    inErrorsMap,
    outErrorsMap,
  );

  // Save directly to PostgreSQL
  await prisma.interface_statistics.createMany({
    data: statistics,
    skipDuplicates: true,
  });

  return statistics;
}
