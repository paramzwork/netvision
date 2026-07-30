import { NextRequest, NextResponse } from "next/server";
import snmp from "net-snmp";
import { DeviceInfoTypes, SnmpResult } from "@/lib/types";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});
export async function GET() {
  const host = process.env.SNMP_HOST!;
  const community = process.env.SNMP_COMMUNITY!;

  const session = snmp.createSession(host, community);

  const results: SnmpResult[] = [];

  return new Promise<Response>((resolve) => {
    session.subtree(
      "1.3.6.1.4.1",
      (varbinds) => {
        for (const varbind of varbinds) {
          if (snmp.isVarbindError(varbind)) continue;

          results.push({
            oid: varbind.oid,
            type: varbind.type ?? 0,
            value: String(varbind.value),
          });
        }
      },
      (error) => {
        session.close();

        if (error) {
          resolve(
            NextResponse.json({ message: error.message }, { status: 500 }),
          );
          return;
        }

        resolve(NextResponse.json(results));
      },
    );
  });
}

export async function POST(req: NextRequest) {
  try {
    const devices = await req.json();
    await prisma.devices.createMany({
      data: devices.map((device: DeviceInfoTypes) => ({
        sysContact: device.sysContact,
        sysDescr: device.sysDescr,
        sysLocation: device.sysLocation,
        sysName: device.sysName,
        sysObjectID: device.sysObjectID,
        ipAddress: device.ipAddress,
      })),
      skipDuplicates: true, // if ipAddress is unique
    });
    return NextResponse.json(
      {
        message: "Devices added successfully.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Internal Server Error." },
      { status: 500 },
    );
  }
}
