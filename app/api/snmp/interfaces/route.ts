import { NextRequest, NextResponse } from "next/server";
import { fetchInterfaces, parseInterfaces, snmpWalk, toMap } from "@/lib/snmp";
import { OIDS } from "@/lib/oid";
import { tripleDecode } from "@/lib/utils";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const reqType = tripleDecode(body.type);

    console.log("Request Type: ", reqType);

    if (reqType === "1") {
      if (!body.host || !body.community) {
        return NextResponse.json(
          { message: "Host and community are required." },
          { status: 400 },
        );
      }
      const host = tripleDecode(body.host);
      const community = tripleDecode(body.community);
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
      const [names, aliases, admin, oper, speed] = await Promise.all([
        snmpWalk(config, OIDS.ifDescr),
        snmpWalk(config, OIDS.ifAlias),
        snmpWalk(config, OIDS.ifAdminStatus),
        snmpWalk(config, OIDS.ifOperStatus),
        snmpWalk(config, OIDS.ifHighSpeed),
      ]);

      const interfaces = parseInterfaces(names);
      const aliasMap = toMap(aliases, (v) => String(v));
      const adminMap = toMap(admin, (v) => Number(v));
      const operMap = toMap(oper, (v) => Number(v));
      const speedMap = toMap(speed, (v) => Number(v));
      const result = fetchInterfaces(
        interfaces,
        aliasMap,
        adminMap,
        operMap,
        speedMap,
      );
      const resultWithDevID = result.map((item) => ({
        ...item,
        deviceId: device?.id,
      }));
      return NextResponse.json(resultWithDevID);
    } else if (reqType === "2") {
      console.log(body.interfaces.slice(0, 10));

      await prisma.interfaces.createMany({
        data: body.interfaces,
        skipDuplicates: true,
      });
      return NextResponse.json({
        message: "Interface added successfully.",
      });
    }
    //  else {
    //   const [
    //     names,
    //     aliases,
    //     admin,
    //     oper,
    //     speed,
    //     inOctets,
    //     outOctets,
    //     inErrors,
    //     outErrors,
    //   ] = await Promise.all([
    //     snmpWalk(config, OIDS.ifDescr),
    //     snmpWalk(config, OIDS.ifAlias),
    //     snmpWalk(config, OIDS.ifAdminStatus),
    //     snmpWalk(config, OIDS.ifOperStatus),
    //     snmpWalk(config, OIDS.ifHighSpeed),
    //     snmpWalk(config, OIDS.ifHCInOctets),
    //     snmpWalk(config, OIDS.ifHCOutOctets),
    //     snmpWalk(config, OIDS.ifInErrors),
    //     snmpWalk(config, OIDS.ifOutErrors),
    //   ]);

    //   const interfaces = parseInterfaces(names);
    //   const aliasMap = toMap(aliases, (v) => String(v));
    //   const adminMap = toMap(admin, (v) => Number(v));
    //   const operMap = toMap(oper, (v) => Number(v));
    //   const speedMap = toMap(speed, (v) => Number(v));

    //   const inOctetsMap = toMap(inOctets, (v) =>
    //     counter64ToNumber(v as Buffer),
    //   );

    //   const outOctetsMap = toMap(outOctets, (v) =>
    //     counter64ToNumber(v as Buffer),
    //   );
    //   console.log("IN OCTETS SAMPLE:", inOctets.slice(0, 5));
    //   console.log("OUT OCTETS SAMPLE:", outOctets.slice(0, 5));

    //   const inErrorsMap = toMap(inErrors, (v) => Number(v));
    //   const outErrorsMap = toMap(outErrors, (v) => Number(v));
    //   const result = mergeInterfaces(
    //     interfaces,
    //     aliasMap,
    //     adminMap,
    //     operMap,
    //     speedMap,
    //     inOctetsMap,
    //     outOctetsMap,
    //     inErrorsMap,
    //     outErrorsMap,
    //   );

    //   return NextResponse.json({
    //     success: true,
    //     data: result,
    //   });
    // }
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      {
        status: 500,
      },
    );
  }
}
