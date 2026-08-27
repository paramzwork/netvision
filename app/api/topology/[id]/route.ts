import { AggregationGroup } from "@/components/DnDContext";
import { NodeHandle, TopologyEdgeData } from "@/components/WeatherMapComponent";
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

    // --------------------------------------------------
    // Validate ID
    // --------------------------------------------------

    if (!Number.isInteger(topologyId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid topology ID",
        },
        { status: 400 },
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
        { status: 404 },
      );
    }

    // --------------------------------------------------
    // Node lookup
    // --------------------------------------------------

    const nodeById = new Map(
      topology.nodes.map((node) => {
        const data = node.data as {
          nodeName?: string;
          nodeType?: string;
        };

        return [node.nodeId, data];
      }),
    );

    // --------------------------------------------------
    // Blank node check
    //
    // blank   = cloud
    // blank1  = router
    // blank2  = server
    //
    // All three are logically blank nodes.
    // --------------------------------------------------

    const isBlankNodeType = (nodeType?: string) =>
      nodeType === "blank" || nodeType === "blank1" || nodeType === "blank2";

    const isBlankNode = (nodeId: string): boolean => {
      const node = nodeById.get(nodeId);

      return isBlankNodeType(node?.nodeType);
    };

    // --------------------------------------------------
    // Get handle
    // --------------------------------------------------

    const getHandle = (
      nodeId: string,
      handleId: string | null,
    ): NodeHandle | undefined => {
      if (!handleId) {
        return undefined;
      }

      const node = topology.nodes.find((node) => node.nodeId === nodeId);

      if (!node) {
        return undefined;
      }

      const data = node.data as {
        handles?: Record<string, NodeHandle[]>;
      };

      if (!data.handles) {
        return undefined;
      }

      for (const handles of Object.values(data.handles)) {
        const handle = handles.find((handle) => handle.id === handleId);

        if (handle) {
          return handle;
        }
      }

      return undefined;
    };

    // --------------------------------------------------
    // Get source interface
    //
    // Normal node:
    //   edge.data.sourceInterfaceId
    //
    // Blank node:
    //   source handle.interfaceId
    //
    // NOTE:
    // This function ONLY returns a direct interface.
    // Aggregation is handled separately.
    // --------------------------------------------------

    const getSourceInterfaceId = (
      edge: (typeof topology.edges)[number],
    ): number | undefined => {
      const data = edge.data as TopologyEdgeData;

      if (isBlankNode(edge.sourceNodeId)) {
        return (
          getHandle(edge.sourceNodeId, edge.sourceHandle)?.interfaceId ??
          undefined
        );
      }

      return data.sourceInterfaceId ?? undefined;
    };

    // --------------------------------------------------
    // Get target interface
    // --------------------------------------------------

    const getTargetInterfaceId = (
      edge: (typeof topology.edges)[number],
    ): number | undefined => {
      const data = edge.data as TopologyEdgeData;

      if (isBlankNode(edge.targetNodeId)) {
        return (
          getHandle(edge.targetNodeId, edge.targetHandle)?.interfaceId ??
          undefined
        );
      }

      return data.targetInterfaceId ?? undefined;
    };

    // --------------------------------------------------
    // Collect ALL interface IDs
    //
    // Includes:
    // - normal source interfaces
    // - normal target interfaces
    // - blank handle interfaces
    // - aggregation interfaces
    // --------------------------------------------------

    const interfaceIds = new Set<number>();

    for (const edge of topology.edges) {
      const sourceInterfaceId = getSourceInterfaceId(edge);
      const targetInterfaceId = getTargetInterfaceId(edge);

      if (typeof sourceInterfaceId === "number") {
        interfaceIds.add(sourceInterfaceId);
      }

      if (typeof targetInterfaceId === "number") {
        interfaceIds.add(targetInterfaceId);
      }
    }

    // --------------------------------------------------
    // Also collect interfaces inside aggregations
    // --------------------------------------------------

    for (const node of topology.nodes) {
      const data = node.data as {
        aggregations?: AggregationGroup[];
      };

      for (const aggregation of data.aggregations ?? []) {
        for (const iface of aggregation.interfaces) {
          if (typeof iface.interfaceId === "number") {
            interfaceIds.add(iface.interfaceId);
          }
        }
      }
    }

    // --------------------------------------------------
    // Load interface status
    // --------------------------------------------------

    const interfaceIdList = Array.from(interfaceIds);

    const interfaceRecords =
      interfaceIdList.length > 0
        ? await prisma.interfaces.findMany({
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
          })
        : [];

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
    // Source interfaces used for traffic
    //
    // Only direct source interfaces are collected here.
    // Aggregated interfaces are added separately below.
    // --------------------------------------------------

    const sourceInterfaceIds = new Set<number>();

    for (const edge of topology.edges) {
      const sourceInterfaceId = getSourceInterfaceId(edge);

      if (typeof sourceInterfaceId === "number") {
        sourceInterfaceIds.add(sourceInterfaceId);
      }

      // If source is a blank node with aggregation,
      // collect all interfaces from the aggregation.
      if (isBlankNode(edge.sourceNodeId)) {
        const handle = getHandle(edge.sourceNodeId, edge.sourceHandle);

        if (handle?.aggregationId) {
          const sourceNode = topology.nodes.find(
            (node) => node.nodeId === edge.sourceNodeId,
          );

          const nodeData = sourceNode?.data as {
            aggregations?: AggregationGroup[];
          };

          const aggregation = nodeData?.aggregations?.find(
            (agg) => agg.id === handle.aggregationId,
          );

          for (const iface of aggregation?.interfaces ?? []) {
            if (typeof iface.interfaceId === "number") {
              sourceInterfaceIds.add(iface.interfaceId);
            }
          }
        }
      }
    }

    // --------------------------------------------------
    // Load statistics
    // --------------------------------------------------

    const statistics =
      sourceInterfaceIds.size > 0
        ? await prisma.interface_statistics.findMany({
            where: {
              interfaceId: {
                in: Array.from(sourceInterfaceIds),
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
          })
        : [];

    // --------------------------------------------------
    // Group statistics by interface
    //
    // Keep latest 2 records.
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

      // Octets -> bits -> bits/sec
      return (Number(octetDifference) * 8) / elapsedSeconds;
    };

    // --------------------------------------------------
    // Find aggregation for a blank node handle
    // --------------------------------------------------

    const getHandleAggregation = (
      nodeId: string,
      handleId: string | null,
    ): AggregationGroup | undefined => {
      const handle = getHandle(nodeId, handleId);

      if (!handle?.aggregationId) {
        return undefined;
      }

      const node = topology.nodes.find((node) => node.nodeId === nodeId);

      if (!node) {
        return undefined;
      }

      const data = node.data as {
        aggregations?: AggregationGroup[];
      };

      return data.aggregations?.find(
        (aggregation) => aggregation.id === handle.aggregationId,
      );
    };

    // --------------------------------------------------
    // Calculate edge traffic
    // --------------------------------------------------

    const calculateEdgeTraffic = (
      edge: (typeof topology.edges)[number],
    ): {
      inbound: number;
      outbound: number;
    } => {
      const sourceIsBlank = isBlankNode(edge.sourceNodeId);

      // ==================================================
      // NORMAL NODE
      // ==================================================

      if (!sourceIsBlank) {
        const sourceInterfaceId = getSourceInterfaceId(edge);

        return {
          inbound: calculateTraffic(sourceInterfaceId, "in"),
          outbound: calculateTraffic(sourceInterfaceId, "out"),
        };
      }

      // ==================================================
      // BLANK NODE
      // ==================================================

      const sourceHandle = getHandle(edge.sourceNodeId, edge.sourceHandle);

      // --------------------------------------------------
      // BLANK NODE + AGGREGATION
      //
      // aggregationId has priority over interfaceId.
      // --------------------------------------------------

      if (sourceHandle?.aggregationId) {
        const aggregation = getHandleAggregation(
          edge.sourceNodeId,
          edge.sourceHandle,
        );

        if (!aggregation) {
          return {
            inbound: 0,
            outbound: 0,
          };
        }

        let inbound = 0;
        let outbound = 0;

        for (const iface of aggregation.interfaces) {
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

      // --------------------------------------------------
      // BLANK NODE + DIRECT HANDLE INTERFACE
      // --------------------------------------------------

      if (typeof sourceHandle?.interfaceId === "number") {
        return {
          inbound: calculateTraffic(sourceHandle.interfaceId, "in"),
          outbound: calculateTraffic(sourceHandle.interfaceId, "out"),
        };
      }

      // --------------------------------------------------
      // OLD AUTOMATIC AGGREGATION
      //
      // Only used when blank source has no interface
      // and no aggregation assigned.
      // --------------------------------------------------

      let inbound = 0;
      let outbound = 0;

      for (const incomingEdge of topology.edges) {
        if (incomingEdge.targetNodeId !== edge.sourceNodeId) {
          continue;
        }

        const incomingInterfaceId = getSourceInterfaceId(incomingEdge);

        if (typeof incomingInterfaceId !== "number") {
          continue;
        }

        inbound += calculateTraffic(incomingInterfaceId, "in");

        outbound += calculateTraffic(incomingInterfaceId, "out");
      }

      return {
        inbound,
        outbound,
      };
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

      // ------------------------------------------------
      // Resolve actual interfaces
      //
      // For blank nodes these come from handles.
      // ------------------------------------------------

      const sourceInterfaceId = getSourceInterfaceId(edge);

      const targetInterfaceId = getTargetInterfaceId(edge);

      const sourceInterface =
        typeof sourceInterfaceId === "number"
          ? interfaceById.get(sourceInterfaceId)
          : undefined;

      const targetInterface =
        typeof targetInterfaceId === "number"
          ? interfaceById.get(targetInterfaceId)
          : undefined;

      // ------------------------------------------------
      // Traffic
      // ------------------------------------------------

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

          // --------------------------------------------
          // Node names
          // --------------------------------------------

          sourceNodeName: sourceNodeData?.nodeName ?? "Unknown",

          targetNodeName: targetNodeData?.nodeName ?? "Unknown",

          sourceDesc: data.sourceDesc,
          targetDesc: data.targetDesc,
          // --------------------------------------------
          // Actual interface IDs
          //
          // This is especially important for blank nodes.
          // --------------------------------------------

          sourceInterfaceId,
          targetInterfaceId,

          // --------------------------------------------
          // Traffic
          // --------------------------------------------

          inbound: traffic.inbound,
          outbound: traffic.outbound,

          // --------------------------------------------
          // Source status
          // --------------------------------------------

          sourceAdminStatus: sourceInterface?.adminStatus ?? 0,

          sourceOperStatus: sourceInterface?.operStatus ?? 0,

          sourceStatus: sourceInterface?.status ?? "",

          // --------------------------------------------
          // Target status
          // --------------------------------------------

          targetAdminStatus: targetInterface?.adminStatus ?? 0,

          targetOperStatus: targetInterface?.operStatus ?? 0,

          targetStatus: targetInterface?.status ?? "",
        },
      };
    });

    // --------------------------------------------------
    // Response
    // --------------------------------------------------

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
