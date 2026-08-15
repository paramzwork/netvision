import { NextRequest, NextResponse } from "next/server";
import { mergeInterfaces, parseInterfaces, snmpWalk, toMap } from "@/lib/snmp";
import { OIDS } from "@/lib/oid";
import { counter64ToNumber, tripleDecode } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { discoverInterfaces } from "@/lib/services/snmp/discoverInterfaces";
import { saveInterfaces } from "@/lib/services/snmp/saveInterfaces";
import { pollTraffic } from "@/lib/services/snmp/pollTraffic";

export async function GET() {
  const host = process.env.SNMP_HOST!;
  const community = process.env.SNMP_COMMUNITY!;
  const config = {
    host,
    community,
  };
  const [
    names,
    aliases,
    admin,
    oper,
    speed,
    inOctets,
    outOctets,
    inErrors,
    outErrors,
  ] = await Promise.all([
    snmpWalk(config, OIDS.ifDescr),
    snmpWalk(config, OIDS.ifAlias),
    snmpWalk(config, OIDS.ifAdminStatus),
    snmpWalk(config, OIDS.ifOperStatus),
    snmpWalk(config, OIDS.ifHighSpeed),
    snmpWalk(config, OIDS.ifHCInOctets),
    snmpWalk(config, OIDS.ifHCOutOctets),
    snmpWalk(config, OIDS.ifInErrors),
    snmpWalk(config, OIDS.ifOutErrors),
  ]);

  const interfaces = parseInterfaces(names);
  const aliasMap = toMap(aliases, (v) => String(v));
  const adminMap = toMap(admin, (v) => Number(v));
  const operMap = toMap(oper, (v) => Number(v));
  const speedMap = toMap(speed, (v) => Number(v));
  const inOctetsMap = toMap(inOctets, (v) => counter64ToNumber(v as Buffer));
  const outOctetsMap = toMap(outOctets, (v) => counter64ToNumber(v as Buffer));
  console.log("IN OCTETS SAMPLE:", inOctets.slice(0, 5));
  console.log("OUT OCTETS SAMPLE:", outOctets.slice(0, 5));
  const inErrorsMap = toMap(inErrors, (v) => Number(v));
  const outErrorsMap = toMap(outErrors, (v) => Number(v));
  const result = mergeInterfaces(
    interfaces,
    aliasMap,
    adminMap,
    operMap,
    speedMap,
    inOctetsMap,
    outOctetsMap,
    inErrorsMap,
    outErrorsMap,
  );
  return NextResponse.json({
    success: true,
    data: result,
  });
}
// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const reqType = tripleDecode(body.type || "");

//     console.log("Request Type: ", reqType);

//     if (reqType === "1") {
//       if (!body.host || !body.community) {
//         return NextResponse.json(
//           { message: "Host and community are required." },
//           { status: 400 },
//         );
//       }
//       const host = tripleDecode(body.host);
//       const community = tripleDecode(body.community);
//       const config = {
//         host,
//         community,
//       };
//       const device = await prisma.devices.findUnique({
//         where: {
//           ipAddress: host,
//         },
//         select: {
//           id: true,
//         },
//       });
//       const [names, aliases, admin, oper, speed] = await Promise.all([
//         snmpWalk(config, OIDS.ifDescr),
//         snmpWalk(config, OIDS.ifAlias),
//         snmpWalk(config, OIDS.ifAdminStatus),
//         snmpWalk(config, OIDS.ifOperStatus),
//         snmpWalk(config, OIDS.ifHighSpeed),
//       ]);

//       const interfaces = parseInterfaces(names);
//       const aliasMap = toMap(aliases, (v) => String(v));
//       const adminMap = toMap(admin, (v) => Number(v));
//       const operMap = toMap(oper, (v) => Number(v));
//       const speedMap = toMap(speed, (v) => Number(v));
//       const result = fetchInterfaces(
//         interfaces,
//         aliasMap,
//         adminMap,
//         operMap,
//         speedMap,
//       );
//       const resultWithDevID = result.map((item) => ({
//         ...item,
//         deviceId: device?.id,
//       }));
//       return NextResponse.json(resultWithDevID);
//     } else if (reqType === "2") {
//       console.log(body.interfaces.slice(0, 10));

//       await prisma.interfaces.createMany({
//         data: body.interfaces,
//         skipDuplicates: true,
//       });
//       return NextResponse.json({
//         message: "Interface added successfully.",
//       });
//     }
//     if (!body.raw || !body.community) {
//       return NextResponse.json(
//         { message: "Host and community are required." },
//         { status: 400 },
//       );
//     }
//     const host = tripleDecode(body.raw);
//     const community = tripleDecode(body.community);
//     const config = {
//       host,
//       community,
//     };
//     console.log(`HOST: ${body.raw} COMMUNITY: ${body.community}`);
//     console.log(`HOST: ${host} COMMUNITY: ${community}`);
//     const device = await prisma.devices.findUnique({
//       where: {
//         ipAddress: host,
//       },
//       select: {
//         id: true,
//       },
//     });
//     if (!device) {
//       return NextResponse.json(
//         { message: "Device not found." },
//         { status: 404 },
//       );
//     }

//     const dbInterfaces = await prisma.interfaces.findMany({
//       where: {
//         deviceId: device.id,
//       },
//       select: {
//         id: true,
//         index: true,
//       },
//     });
//     const interfaceIdMap = new Map(
//       dbInterfaces.map((iface) => [iface.index, iface.id]),
//     );
//     const [names, inOctets, outOctets, inErrors, outErrors] = await Promise.all(
//       [
//         snmpWalk(config, OIDS.ifDescr),
//         snmpWalk(config, OIDS.ifHCInOctets),
//         snmpWalk(config, OIDS.ifHCOutOctets),
//         snmpWalk(config, OIDS.ifInErrors),
//         snmpWalk(config, OIDS.ifOutErrors),
//       ],
//     );
//     const interfaces = parseInterfaces(names);

//     const inOctetsMap = toMap(inOctets, (v) => counter64ToNumber(v as Buffer));

//     const outOctetsMap = toMap(outOctets, (v) =>
//       counter64ToNumber(v as Buffer),
//     );
//     console.log("IN OCTETS SAMPLE:", inOctets.slice(0, 5));
//     console.log("OUT OCTETS SAMPLE:", outOctets.slice(0, 5));

//     const inErrorsMap = toMap(inErrors, (v) => Number(v));
//     const outErrorsMap = toMap(outErrors, (v) => Number(v));
//     const result = fetchInOutOctets(
//       interfaces,
//       interfaceIdMap,
//       inOctetsMap,
//       outOctetsMap,
//       inErrorsMap,
//       outErrorsMap,
//     );

//     return NextResponse.json(result);
//   } catch (err) {
//     return NextResponse.json(
//       {
//         success: false,
//         error: err instanceof Error ? err.message : String(err),
//       },
//       {
//         status: 500,
//       },
//     );
//   }
// }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const reqType = tripleDecode(body.type ?? "");

    switch (reqType) {
      case "1":
        return NextResponse.json(
          await discoverInterfaces(
            tripleDecode(body.host),
            tripleDecode(body.community),
          ),
        );

      case "2":
        return NextResponse.json(await saveInterfaces(body.interfaces));

      default:
        return NextResponse.json(
          await pollTraffic(
            tripleDecode(body.raw),
            tripleDecode(body.community),
          ),
        );
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();

    if (!["1", "0"].includes(status)) {
      return NextResponse.json(
        { message: "Invalid request." },
        { status: 400 },
      );
    }

    const updatedInterface = await prisma.interfaces.update({
      where: {
        id,
      },
      data: {
        status,
      },
      select: {
        id: true,
        status: true,
      },
    });

    return NextResponse.json({
      message: "Interface status updated successfully.",
      data: updatedInterface,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Internal Server Error.",
      },
      {
        status: 500,
      },
    );
  }
}
