import { NextRequest, NextResponse } from "next/server";
import { DeviceInfoTypes } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";
import { tripleDecode } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

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
export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = req.nextUrl.searchParams.get("id");

    // No id -> return all devices
    if (!id) {
      const devices = await prisma.devices.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({
        data: devices,
        message: "Loaded devices successfully.",
      });
    }

    const ipAddress = tripleDecode(id);
    console.log("Request", ipAddress);
    if (ipAddress === "all") {
      const devices = await prisma.devices.findMany({
        select: {
          ipAddress: true,
          hostname: true,
          community: true,
          vendor: true,
          model: true,
          serialNumber: true,
          macAddress: true,
          status: true,
          sysName: true,
          sysDescr: true,
          sysContact: true,
          sysLocation: true,
          sysObjectID: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({
        data: devices,
        message: "Loaded devices successfully!",
      });
    } else if (ipAddress) {
      const device = await prisma.devices.findUnique({
        where: {
          ipAddress,
        },
        select: {
          ipAddress: true,
          sysName: true,
          community: true,
          status: true,
        },
      });
      if (!device) {
        return NextResponse.json(
          { message: "Device not found." },
          { status: 404 },
        );
      }
      return NextResponse.json(device);
    } else {
      const devices = await prisma.devices.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({
        data: devices,
        message: "Loaded devices successfully.",
      });
    }
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

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
        community: device.community,
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
