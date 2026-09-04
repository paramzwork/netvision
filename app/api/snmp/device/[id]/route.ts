import { getRequestInfo } from "@/app/api/users/route";
import { getCurrentUser } from "@/lib/auth";
import { createUserLog } from "@/lib/logs";
import { prisma } from "@/lib/prisma";
import { tripleDecode } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
      },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;

    const decodedID = Number(tripleDecode(id));

    // Validate decoded device ID
    if (!Number.isInteger(decodedID) || decodedID <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid device ID.",
        },
        { status: 400 },
      );
    }

    // Find device first
    const device = await prisma.devices.findUnique({
      where: {
        id: decodedID,
      },
    });

    if (!device) {
      return NextResponse.json(
        {
          success: false,
          message: "Device not found.",
        },
        { status: 404 },
      );
    }
    console.log(`FOUND DEVICE: ${device}`);
    // Find all interfaces belonging to this device
    const interfaces = await prisma.interfaces.findMany({
      where: {
        deviceId: decodedID,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const interfaceIds = interfaces.map((iface) => iface.id);
    console.log("INTERFACES", interfaces);
    console.log("INTERFACE IDS", interfaceIds);

    const topologyNodes = await prisma.topology_nodes.findMany({
      select: {
        id: true,
        topologyId: true,
        nodeId: true,
        deviceId: true,
        interfaceId: true,
        data: true,
        topology: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log("ALL TOPOLOGY NODES:", topologyNodes);
    const usedTopologyNodes = topologyNodes.filter((node) => {
      if (
        typeof node.interfaceId === "number" &&
        interfaceIds.includes(node.interfaceId)
      ) {
        return true;
      }

      const data = node.data as {
        handles?: {
          top?: Array<{ interfaceId?: number }>;
          right?: Array<{ interfaceId?: number }>;
          bottom?: Array<{ interfaceId?: number }>;
          left?: Array<{ interfaceId?: number }>;
        };
      };

      const handles = data?.handles;

      if (!handles) {
        return false;
      }

      const positions = ["top", "right", "bottom", "left"] as const;

      for (const position of positions) {
        const handleList = handles[position];

        if (!Array.isArray(handleList)) {
          continue;
        }

        for (const handle of handleList) {
          if (
            typeof handle?.interfaceId === "number" &&
            interfaceIds.includes(handle.interfaceId)
          ) {
            return true;
          }
        }
      }

      return false;
    });
    console.log("TOPOLOGY NODES USING DEVICE INTERFACES:", usedTopologyNodes);
    if (usedTopologyNodes.length > 0) {
      const topologyNames = [
        ...new Set(usedTopologyNodes.map((node) => node.topology.name)),
      ];

      const usedInterfaceIds = new Set<number>();

      for (const node of usedTopologyNodes) {
        // Normal interface node
        if (
          typeof node.interfaceId === "number" &&
          interfaceIds.includes(node.interfaceId)
        ) {
          usedInterfaceIds.add(node.interfaceId);
        }

        // Blank node handles
        const data = node.data as {
          handles?: {
            top?: Array<{ interfaceId?: number }>;
            right?: Array<{ interfaceId?: number }>;
            bottom?: Array<{ interfaceId?: number }>;
            left?: Array<{ interfaceId?: number }>;
          };
        };

        const handles = data?.handles;

        if (handles) {
          const positions = ["top", "right", "bottom", "left"] as const;

          for (const position of positions) {
            const handleList = handles[position];

            if (!Array.isArray(handleList)) {
              continue;
            }

            for (const handle of handleList) {
              if (
                typeof handle?.interfaceId === "number" &&
                interfaceIds.includes(handle.interfaceId)
              ) {
                usedInterfaceIds.add(handle.interfaceId);
              }
            }
          }
        }
      }

      const interfaceNames = interfaces
        .filter((iface) => usedInterfaceIds.has(iface.id))
        .map((iface) => iface.name);

      return NextResponse.json(
        {
          success: false,
          message:
            `Cannot delete device "${device.sysName}" because ` +
            `interface(s) from this device are currently used in ` +
            `topology(s): ${topologyNames
              .map((name) => `"${name}"`)
              .join(", ")}. ` +
            `Remove ${interfaceNames.join(", ")} from the topology ` +
            `before deleting the device.`,
        },
        { status: 409 },
      );
    }

    await prisma.devices.delete({
      where: {
        id: decodedID,
      },
    });

    const { ipAddress, userAgent } = getRequestInfo(req);

    await createUserLog({
      userId: currentUser.id,
      action: "DELETE_DEVICE",
      description:
        `Deleted device "${device.sysName ?? "Unknown"}" ` +
        `(IP: ${device.ipAddress}, ID: ${device.id}).`,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Device deleted successfully.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE DEVICE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete device.",
      },
      { status: 500 },
    );
  }
}
