import { NextRequest, NextResponse } from "next/server";
import snmp from "net-snmp";

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
            { status: 500 }
          )
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
        })
      );
    });
  });
}
export async function POST(req: NextRequest) {
  const body = await req.json();
  const host = body.descoverIP;
  console.log("HOST", host);
  const community = process.env.SNMP_COMMUNITY;

  if (!host || !community) {
    return NextResponse.json(
      { message: "SNMP configuration missing." },
      { status: 500 },
    );
  }

  const session = snmp.createSession(host, community);

  const oids = [
    "1.3.6.1.2.1.1.1.0", // sysDescr
    "1.3.6.1.2.1.1.2.0", // sysObjectID
    "1.3.6.1.2.1.1.5.0", // sysName
    "1.3.6.1.2.1.1.6.0", // sysLocation
    "1.3.6.1.2.1.1.4.0", // sysContact
  ];

  return new Promise<Response>((resolve) => {
    session.get(oids, (error, varbinds) => {
      session.close();

      if (error) {
        resolve(NextResponse.json({ message: error.message }, { status: 500 }));
        return;
      }

      const data = {
        sysDescr: varbinds?.[0]?.value?.toString(),
        sysObjectID: varbinds?.[1]?.value?.toString(),
        sysName: varbinds?.[2]?.value?.toString(),
        sysLocation: varbinds?.[3]?.value?.toString(),
        sysContact: varbinds?.[4]?.value?.toString(),
        ipAddress: host,
      };

      resolve(NextResponse.json(data));
    });
  });
}
