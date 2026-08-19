import { TopologyEdgeData } from "@/components/WeatherMapComponent";
import { getCurrentUser } from "@/lib/auth";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { tripleDecode } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

type UpdateTopologyRequest = {
  name: string;
  description?: string | null;

  nodes: Array<{
    id: string;
    type?: string;

    position: {
      x: number;
      y: number;
    };

    width?: number | null;
    height?: number | null;

    data: Record<string, unknown>;
  }>;

  edges: Array<{
    id: string;

    source: string;
    target: string;

    sourceHandle?: string | null;
    targetHandle?: string | null;

    type?: string | null;

    data?: Record<string, unknown>;
  }>;
};

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    const topologyId = Number(id);

    if (!Number.isInteger(topologyId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid topology ID",
        },
        {
          status: 400,
        },
      );
    }

    // --------------------------------------------------
    // Load topology
    // --------------------------------------------------

    const topology = await prisma.topologies.findUnique({
      where: {
        id: topologyId,
      },
      include: {
        nodes: {
          orderBy: {
            id: "asc",
          },
        },
        edges: {
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    if (!topology) {
      return NextResponse.json(
        {
          success: false,
          message: "Topology not found",
        },
        {
          status: 404,
        },
      );
    }

    // --------------------------------------------------
    // Collect interface IDs
    //
    // We need both source and target IDs for STATUS.
    // But traffic statistics will ONLY use source IDs.
    // --------------------------------------------------

    const interfaceIds = new Set<number>();

    topology.edges.forEach((edge) => {
      const data = edge.data as {
        sourceInterfaceId?: number;
        targetInterfaceId?: number;
      };

      if (typeof data.sourceInterfaceId === "number") {
        interfaceIds.add(data.sourceInterfaceId);
      }

      if (typeof data.targetInterfaceId === "number") {
        interfaceIds.add(data.targetInterfaceId);
      }
    });

    const interfaceIdList = Array.from(interfaceIds);

    // --------------------------------------------------
    // Load interface status
    //
    // Used for both source and target interfaces.
    // --------------------------------------------------

    const interfaceRecords = await prisma.interfaces.findMany({
      where: {
        id: {
          in: interfaceIdList,
        },
      },

      select: {
        id: true,
        adminStatus: true,
        operStatus: true,
        status: true,
      },
    });

    const interfaceById = new Map(
      interfaceRecords.map((iface) => [
        iface.id,
        {
          adminStatus: iface.adminStatus,
          operStatus: iface.operStatus,
          status: iface.status ?? "",
        },
      ]),
    );

    // --------------------------------------------------
    // Load statistics
    //
    // IMPORTANT:
    // Traffic is calculated ONLY from source interfaces.
    // --------------------------------------------------

    const sourceInterfaceIds = Array.from(
      new Set(
        topology.edges
          .map((edge) => {
            const data = edge.data as {
              sourceInterfaceId?: number;
            };

            return data.sourceInterfaceId;
          })
          .filter((id): id is number => typeof id === "number"),
      ),
    );

    const statistics = await prisma.interface_statistics.findMany({
      where: {
        interfaceId: {
          in: sourceInterfaceIds,
        },
      },

      orderBy: [
        {
          interfaceId: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    // --------------------------------------------------
    // Group statistics by interface
    //
    // Only keep the latest 2 records.
    // --------------------------------------------------

    const statisticsByInterface = new Map<number, typeof statistics>();

    for (const stat of statistics) {
      const existing = statisticsByInterface.get(stat.interfaceId);

      if (!existing) {
        statisticsByInterface.set(stat.interfaceId, [stat]);
        continue;
      }

      if (existing.length < 2) {
        existing.push(stat);
      }
    }

    // --------------------------------------------------
    // Calculate traffic
    // --------------------------------------------------

    const calculateTraffic = (
      interfaceId: number | null | undefined,
      direction: "in" | "out",
    ): number => {
      if (typeof interfaceId !== "number") {
        return 0;
      }

      const stats = statisticsByInterface.get(interfaceId);

      if (!stats || stats.length < 2) {
        return 0;
      }

      const current = stats[0];
      const previous = stats[1];

      const elapsedSeconds =
        (current.createdAt.getTime() - previous.createdAt.getTime()) / 1000;

      if (elapsedSeconds <= 0) {
        return 0;
      }

      const currentOctets =
        direction === "in" ? current.inOctets : current.outOctets;

      const previousOctets =
        direction === "in" ? previous.inOctets : previous.outOctets;

      // Counter reset protection
      if (currentOctets < previousOctets) {
        return 0;
      }

      const octetDifference = currentOctets - previousOctets;

      // Octets → bits → bits/sec
      return (Number(octetDifference) * 8) / elapsedSeconds;
    };

    const nodeById = new Map(
      topology.nodes.map((node) => {
        const nodeData = node.data as {
          nodeName?: string;
          nodeType?: string;
        };

        return [node.nodeId, nodeData];
      }),
    );
    const isBlankNode = (nodeId: string): boolean => {
      const node = nodeById.get(nodeId);

      if (!node) {
        return false;
      }

      return node.nodeType === "blank";
    };
    const calculateEdgeTraffic = (
      edge: (typeof topology.edges)[number],
    ): { inbound: number; outbound: number } => {
      const data = edge.data as TopologyEdgeData;
      const sourceIsBlank = isBlankNode(edge.sourceNodeId);
      const targetIsBlank = isBlankNode(edge.targetNodeId);
      if (!sourceIsBlank && !targetIsBlank) {
        return {
          inbound: calculateTraffic(data.sourceInterfaceId, "in"),
          outbound: calculateTraffic(data.sourceInterfaceId, "out"),
        };
      }
      if (!sourceIsBlank && targetIsBlank) {
        return {
          inbound: calculateTraffic(data.sourceInterfaceId, "in"),
          outbound: calculateTraffic(data.sourceInterfaceId, "out"),
        };
      }
      if (sourceIsBlank && !targetIsBlank) {
        let inbound = 0;
        let outbound = 0;

        // ---------------------------------------------
        // MANUAL AGGREGATION
        // ---------------------------------------------

        if (data.aggregationId && Array.isArray(data.aggregatedInterfaces)) {
          for (const iface of data.aggregatedInterfaces) {
            if (typeof iface.interfaceId !== "number") {
              continue;
            }

            inbound += calculateTraffic(iface.interfaceId, "in");

            outbound += calculateTraffic(iface.interfaceId, "out");
          }

          return {
            inbound,
            outbound,
          };
        }

        // ---------------------------------------------
        // AUTOMATIC AGGREGATION
        // ---------------------------------------------

        for (const incomingEdge of topology.edges) {
          if (incomingEdge.targetNodeId !== edge.sourceNodeId) {
            continue;
          }

          const incomingData = incomingEdge.data as TopologyEdgeData;

          if (typeof incomingData.sourceInterfaceId !== "number") {
            continue;
          }

          inbound += calculateTraffic(incomingData.sourceInterfaceId, "in");

          outbound += calculateTraffic(incomingData.sourceInterfaceId, "out");
        }

        return {
          inbound,
          outbound,
        };
      }
      if (sourceIsBlank && targetIsBlank) {
        let inbound = 0;
        let outbound = 0;
        for (const incomingEdge of topology.edges) {
          if (incomingEdge.targetNodeId !== edge.sourceNodeId) {
            continue;
          }
          const incomingTraffic = calculateEdgeTraffic(incomingEdge);
          inbound += incomingTraffic.inbound;
          outbound += incomingTraffic.outbound;
        }
        return { inbound, outbound };
      }
      return { inbound: 0, outbound: 0 };
    };
    // --------------------------------------------------
    // Nodes
    // --------------------------------------------------

    const nodes = topology.nodes.map((node) => ({
      id: node.nodeId,

      type: node.type,

      position: {
        x: node.positionX,
        y: node.positionY,
      },

      width: node.width,
      height: node.height,

      data: node.data,
    }));

    // --------------------------------------------------
    // Edges
    // --------------------------------------------------
    const edges = topology.edges.map((edge) => {
      const data = edge.data as TopologyEdgeData;
      const sourceInterface =
        typeof data.sourceInterfaceId === "number"
          ? interfaceById.get(data.sourceInterfaceId)
          : undefined;
      const targetInterface =
        typeof data.targetInterfaceId === "number"
          ? interfaceById.get(data.targetInterfaceId)
          : undefined;
      const traffic = calculateEdgeTraffic(edge);

      const sourceNodeData = nodeById.get(edge.sourceNodeId);
      const targetNodeData = nodeById.get(edge.targetNodeId);
      return {
        id: edge.edgeId,
        source: edge.sourceNodeId,
        target: edge.targetNodeId,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edge.type ?? undefined,
        data: {
          ...data,
          sourceNodeName: sourceNodeData?.nodeName ?? "Unknown",
          targetNodeName: targetNodeData?.nodeName ?? "Unknown",
          inbound: traffic.inbound,
          outbound: traffic.outbound,
          sourceAdminStatus: sourceInterface?.adminStatus ?? 0,
          sourceOperStatus: sourceInterface?.operStatus ?? 0,
          sourceStatus: sourceInterface?.status ?? "",
          targetAdminStatus: targetInterface?.adminStatus ?? 0,
          targetOperStatus: targetInterface?.operStatus ?? 0,
          targetStatus: targetInterface?.status ?? "",
        },
      };
    });

    // --------------------------------------------------
    // Response
    // --------------------------------------------------
    console.log(nodes);

    return NextResponse.json({
      success: true,
      data: {
        id: topology.id,
        name: topology.name,
        description: topology.description,

        nodes,
        edges,
      },
    });
  } catch (error) {
    console.error("LOAD TOPOLOGY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load topology",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    const topologyId = Number(id);

    // ---------------------------------------------
    // Validate ID
    // ---------------------------------------------

    if (!Number.isInteger(topologyId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid topology ID",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------
    // Parse body
    // ---------------------------------------------

    const body = (await request.json()) as UpdateTopologyRequest;

    const { name, description, nodes, edges } = body;

    // ---------------------------------------------
    // Validate
    // ---------------------------------------------

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Topology name is required",
        },
        {
          status: 400,
        },
      );
    }

    if (!Array.isArray(nodes)) {
      return NextResponse.json(
        {
          success: false,
          message: "Nodes must be an array",
        },
        {
          status: 400,
        },
      );
    }

    if (!Array.isArray(edges)) {
      return NextResponse.json(
        {
          success: false,
          message: "Edges must be an array",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------
    // Check topology exists
    // ---------------------------------------------

    const existingTopology = await prisma.topologies.findUnique({
      where: {
        id: topologyId,
      },
    });

    if (!existingTopology) {
      return NextResponse.json(
        {
          success: false,
          message: "Topology not found",
        },
        {
          status: 404,
        },
      );
    }

    // ---------------------------------------------
    // Update everything in one transaction
    // ---------------------------------------------

    const topology = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // -----------------------------------------
        // Update topology
        // -----------------------------------------

        const updatedTopology = await tx.topologies.update({
          where: {
            id: topologyId,
          },

          data: {
            name,
            description: description ?? null,
          },
        });

        // -----------------------------------------
        // Delete existing edges
        // -----------------------------------------

        await tx.topology_edges.deleteMany({
          where: {
            topologyId,
          },
        });

        // -----------------------------------------
        // Delete existing nodes
        // -----------------------------------------

        await tx.topology_nodes.deleteMany({
          where: {
            topologyId,
          },
        });

        // -----------------------------------------
        // Insert current nodes
        // -----------------------------------------

        if (nodes.length > 0) {
          await tx.topology_nodes.createMany({
            data: nodes.map((node) => ({
              topologyId,

              nodeId: node.id,

              type: node.type ?? "default",

              positionX: node.position.x,
              positionY: node.position.y,

              width: node.width ?? 0,
              height: node.height ?? 0,

              deviceId:
                typeof node.data?.deviceId === "number"
                  ? node.data.deviceId
                  : null,

              interfaceId:
                typeof node.data?.interfaceId === "number"
                  ? node.data.interfaceId
                  : null,

              data: node.data as Prisma.InputJsonValue,
            })),
          });
        }

        // -----------------------------------------
        // Insert current edges
        // -----------------------------------------

        if (edges.length > 0) {
          await tx.topology_edges.createMany({
            data: edges.map((edge) => ({
              topologyId,

              edgeId: edge.id,

              sourceNodeId: edge.source,
              targetNodeId: edge.target,

              sourceHandle: edge.sourceHandle ?? null,

              targetHandle: edge.targetHandle ?? null,

              type: edge.type ?? null,

              data: (edge.data ?? {}) as Prisma.InputJsonValue,
            })),
          });
        }

        return updatedTopology;
      },
    );

    // ---------------------------------------------
    // Response
    // ---------------------------------------------

    return NextResponse.json({
      success: true,

      message: "Topology updated successfully",

      data: {
        id: topology.id,
        name: topology.name,
        description: topology.description,
      },
    });
  } catch (error) {
    console.error("UPDATE TOPOLOGY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update topology",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const decodedID = tripleDecode(id);

  await prisma.topologies.delete({
    where: {
      id: Number(decodedID),
    },
  });

  return NextResponse.json({
    message: "Topology deleted successfully.",
  });
}
