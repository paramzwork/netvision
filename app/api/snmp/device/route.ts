import { NextRequest, NextResponse } from "next/server";
import { DeviceInfoTypes } from "@/lib/types";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCurrentUser } from "@/lib/auth";
import { tripleDecode } from "@/lib/utils";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});
// export async function GET() {
//   const host = process.env.SNMP_HOST!;
//   const community = process.env.SNMP_COMMUNITY!;

//   const session = snmp.createSession(host, community);

//   const results: SnmpResult[] = [];

//   return new Promise<Response>((resolve) => {
//     session.subtree(
//       "1.3.6.1.4.1",
//       (varbinds) => {
//         for (const varbind of varbinds) {
//           if (snmp.isVarbindError(varbind)) continue;

//           results.push({
//             oid: varbind.oid,
//             type: varbind.type ?? 0,
//             value: String(varbind.value),
//           });
//         }
//       },
//       (error) => {
//         session.close();

//         if (error) {
//           resolve(
//             NextResponse.json({ message: error.message }, { status: 500 }),
//           );
//           return;
//         }

//         resolve(NextResponse.json(results));
//       },
//     );
//   });
// }
export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const devices = await prisma.devices.findMany({
      select: {
        sysName: true,
        ipAddress: true,
        status: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      data: devices,
      message: "Loaded devices successfully!",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch devices.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { message: "Missing IP Address" },
      { status: 400 },
    );
  }
  const ipAddress = tripleDecode(id);
  if (ipAddress) {
    const device = await prisma.devices.findUnique({
      where: {
        ipAddress,
      },
      select: {
        ipAddress: true,
        sysName: true,
        status: true,
      },
    });

    if (!device) {
      return NextResponse.json(
        { message: "Device not found." },
        { status: 404 },
      );
    }

    console.log(device);
    return NextResponse.json(device);
  }
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
        status: "1",
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
