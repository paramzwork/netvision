import { NextRequest, NextResponse } from "next/server";
import { tripleDecode } from "@/lib/utils";
import { pollTraffic } from "@/lib/services/snmp/pollTraffic";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const deviceId = searchParams.get("id");
    console.log("DEVICE ID:", deviceId);
    if (!deviceId) {
      return NextResponse.json(
        { message: "Missing device Id." },
        { status: 400 },
      );
    }
    const host = tripleDecode(deviceId);
    const device = await prisma.devices.findUnique({
      where: {
        ipAddress: host,
      },
      select: {
        id: true,
      },
    });
    const interfaces = await prisma.interfaces.findMany({
      where: {
        deviceId: device?.id,
      },

      include: {
        statistics: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
    
    const serialized = JSON.parse(
      JSON.stringify({ interfaces }, (_, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );
    return NextResponse.json(serialized);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Internal Server Error." },
      { status: 500 },
    );
  }
}
// export async function POST(req: NextRequest) {
//   try {
//     const { host, community } = await req.json();

//     const statistics = await pollTraffic(host, community);

//     return NextResponse.json({
//       message: "Traffic polled successfully.",
//       count: statistics.length,
//     });
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
    const { host, community } = await req.json();

    const statistics = await pollTraffic(host, community);

    return NextResponse.json({
      message: "Traffic polled successfully.",
      count: statistics.length,
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