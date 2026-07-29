import { NextResponse } from "next/server";
import { mergeInterfaces, parseInterfaces, snmpWalk, toMap } from "@/lib/snmp";
import { OIDS } from "@/lib/oid";
import { counter64ToNumber } from "@/lib/utils";

export async function GET() {
  try {
    const config = {
      host: process.env.SNMP_HOST!,
      community: process.env.SNMP_COMMUNITY!,
    };

    const [
      names,
      admin,
      oper,
      speed,
      inOctets,
      outOctets,
      inErrors,
      outErrors,
    ] = await Promise.all([
      snmpWalk(config, OIDS.ifDescr),
      snmpWalk(config, OIDS.ifAdminStatus),
      snmpWalk(config, OIDS.ifOperStatus),
      snmpWalk(config, OIDS.ifHighSpeed),
      snmpWalk(config, OIDS.ifHCInOctets),
      snmpWalk(config, OIDS.ifHCOutOctets),
      snmpWalk(config, OIDS.ifInErrors),
      snmpWalk(config, OIDS.ifOutErrors),
    ]);

    const interfaces = parseInterfaces(names);

    const adminMap = toMap(admin, (v) => Number(v));
    const operMap = toMap(oper, (v) => Number(v));
    const speedMap = toMap(speed, (v) => Number(v));

    const inOctetsMap = toMap(inOctets, (v) => counter64ToNumber(v as Buffer));

    const outOctetsMap = toMap(outOctets, (v) =>
      counter64ToNumber(v as Buffer),
    );
    console.log("IN OCTETS SAMPLE:", inOctets.slice(0, 5));
    console.log("OUT OCTETS SAMPLE:", outOctets.slice(0, 5));

    const inErrorsMap = toMap(inErrors, (v) => Number(v));
    const outErrorsMap = toMap(outErrors, (v) => Number(v));
    const result = mergeInterfaces(
      interfaces,
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
