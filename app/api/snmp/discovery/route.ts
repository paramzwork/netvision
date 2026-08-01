import { NextRequest, NextResponse } from "next/server";
import snmp from "net-snmp";
import { OIDS } from "@/lib/oid";
import { formatUptime } from "@/lib/utils";

export async function GET() {
  const host = process.env.SNMP_HOST!;
  const community = process.env.SNMP_COMMUNITY!;

  const session = snmp.createSession(host, community);

  const oids = [
    process.env.OID_HOSTNAME!,
    process.env.OID_VENDOR!,
    process.env.OID_MODEL!,
    process.env.OID_SERIAL!,
    process.env.OID_MAC!,
  ];

  return new Promise<Response>((resolve) => {
    session.get(oids, (error, varbinds) => {
      session.close();

      if (error) {
        resolve(
          NextResponse.json(
            {
              status: "Offline",
              message: error.message,
            },
            { status: 500 },
          ),
        );
        return;
      }

      resolve(
        NextResponse.json({
          hostname: varbinds?.[0]?.value?.toString() ?? null,
          vendor: varbinds?.[1]?.value?.toString() ?? null,
          model: varbinds?.[2]?.value?.toString() ?? null,
          serialNumber: varbinds?.[3]?.value?.toString() ?? null,
          macAddress: varbinds?.[4]?.value?.toString() ?? null,
          status: "Online",
        }),
      );
    });
  });
}
export async function POST(req: NextRequest) {
  const body = await req.json();
  const host = body.discoverIP;
  const community = body.discoverCommunity;
  console.log(`Host: ${host} : Community: ${community}`);

  if (!host || !community) {
    return NextResponse.json(
      { message: "SNMP configuration missing." },
      { status: 500 },
    );
  }

  const session = snmp.createSession(host, community, {
    timeout: 5000,
    retries: 1,
  });

  const oids = [
    OIDS.sysDescr,
    OIDS.sysObjectID,
    OIDS.sysName,
    OIDS.sysLocation,
    OIDS.sysContact,
    OIDS.sysUpTime,
  ];
  const start = performance.now();
  const pollTime = new Date().toISOString();
  return new Promise<Response>((resolve) => {
    session.get(oids, (error, varbinds) => {
      session.close();
      const currentMs = Math.round(performance.now() - start);
      if (error) {
        resolve(NextResponse.json({ message: error.message }, { status: 500 }));
        return;
      }
      console.log(varbinds?.[5]?.value);
      const data = {
        sysDescr: varbinds?.[0]?.value?.toString(),
        sysObjectID: varbinds?.[1]?.value?.toString(),
        sysName: varbinds?.[2]?.value?.toString(),
        sysLocation: varbinds?.[3]?.value?.toString(),
        sysContact: varbinds?.[4]?.value?.toString(),
        uptime: formatUptime(Number(varbinds?.[5]?.value)),
        ipAddress: host,
        community: community,
        pollTime,
        currentMs,
      };

      resolve(NextResponse.json(data));
    });
  });
}
