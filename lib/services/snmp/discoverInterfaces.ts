import { fetchInterfaces, parseInterfaces, snmpWalk, toMap } from "@/lib/snmp";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { OIDS } from "@/lib/oid";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});
export async function discoverInterfaces(host: string, community: string) {
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

  const [names, aliases, admin, oper, speed] = await Promise.all([
    snmpWalk(config, OIDS.ifDescr),
    snmpWalk(config, OIDS.ifAlias),
    snmpWalk(config, OIDS.ifAdminStatus),
    snmpWalk(config, OIDS.ifOperStatus),
    snmpWalk(config, OIDS.ifHighSpeed),
  ]);

  const interfaces = parseInterfaces(names);

  return fetchInterfaces(
    interfaces,
    toMap(aliases, String),
    toMap(admin, Number),
    toMap(oper, Number),
    toMap(speed, Number),
  ).map((iface) => ({
    ...iface,
    deviceId: device.id,
  }));
}
