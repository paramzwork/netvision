import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TopologyEdgeData } from "@/components/WeatherMapComponent";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type InterfaceSample = {
  interfaceId: number;
  inOctets: bigint;
  outOctets: bigint;
  createdAt: Date;
};

type NodeData = {
  nodeType?: string;
  nodeName?: string;

  aggregationMode?: "automatic" | "manual";

  aggregations?: Array<{
    id: string;
    name: string;
    interfaces: Array<{
      id: string;
      interfaceId?: number;
      interfaceName?: string;
      nodeName?: string;
    }>;
  }>;

  handles?: Record<
    string,
    Array<{
      id: string;
      interfaceId?: number;
      interfaceName?: string;
      nodeName?: string;
      aggregationId?: string;
    }>
  >;
};

interface AggregatedInterfaceTraffic {
  interfaceId: number;
  interfaceName: string;
  inbound: number;
  outbound: number;
}

/**
 * Calculate bits per second from two SNMP counter samples.
 */
function calculateRate(
  currentOctets: bigint,
  previousOctets: bigint,
  elapsedSeconds: number,
): number {
  if (elapsedSeconds <= 0) {
    return 0;
  }

  // Counter reset / invalid sample
  if (currentOctets < previousOctets) {
    return 0;
  }

  const octetDifference = currentOctets - previousOctets;

  // Octets → bits → bits/sec
  return (Number(octetDifference) * 8) / elapsedSeconds;
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
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 1. Get topology nodes
    // --------------------------------------------------

    const nodes = await prisma.topology_nodes.findMany({
      where: {
        topologyId,
      },
      select: {
        nodeId: true,
        data: true,
      },
    });

    // --------------------------------------------------
    // 2. Get topology edges
    // --------------------------------------------------

    const edges = await prisma.topology_edges.findMany({
      where: {
        topologyId,
      },
      select: {
        edgeId: true,
        sourceNodeId: true,
        targetNodeId: true,
        sourceHandle: true,
        targetHandle: true,
        data: true,
      },
    });

    if (edges.length === 0) {
      return NextResponse.json({
        success: true,
        data: {},
      });
    }

    // --------------------------------------------------
    // 3. Node lookup
    // --------------------------------------------------

    const nodeById = new Map(
      nodes.map((node) => [node.nodeId, node.data as NodeData]),
    );

    const isBlankNodeType = (nodeType?: string) =>
      nodeType === "blank" || nodeType === "blank1";

    const isBlankNode = (nodeId: string) => {
      return isBlankNodeType(nodeById.get(nodeId)?.nodeType);
    };

    // --------------------------------------------------
    // 4. Collect interface IDs
    //
    // We collect:
    //
    // - source interfaces
    // - target interfaces
    // - interfaces inside manual aggregations
    // --------------------------------------------------

    const interfaceIds = new Set<number>();

    for (const edge of edges) {
      const data = edge.data as TopologyEdgeData;

      if (typeof data.sourceInterfaceId === "number") {
        interfaceIds.add(data.sourceInterfaceId);
      }

      if (typeof data.targetInterfaceId === "number") {
        interfaceIds.add(data.targetInterfaceId);
      }
    }

    // Also collect interfaces from aggregation configuration.
    for (const node of nodes) {
      const nodeData = node.data as NodeData;

      for (const aggregation of nodeData.aggregations ?? []) {
        for (const iface of aggregation.interfaces ?? []) {
          if (typeof iface.interfaceId === "number") {
            interfaceIds.add(iface.interfaceId);
          }
        }
      }
    }

    // --------------------------------------------------
    // 5. Load statistics
    // --------------------------------------------------

    const statistics = await prisma.interface_statistics.findMany({
      where: {
        interfaceId: {
          in: Array.from(interfaceIds),
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

      select: {
        interfaceId: true,
        inOctets: true,
        outOctets: true,
        createdAt: true,
      },
    });

    // --------------------------------------------------
    // 6. Keep latest 2 statistics per interface
    // --------------------------------------------------

    const statisticsMap = new Map<number, InterfaceSample[]>();

    for (const sample of statistics) {
      const existing = statisticsMap.get(sample.interfaceId);

      if (!existing) {
        statisticsMap.set(sample.interfaceId, [sample]);
        continue;
      }

      if (existing.length < 2) {
        existing.push(sample);
      }
    }

    // --------------------------------------------------
    // 7. Calculate interface traffic
    // --------------------------------------------------

    const getRate = (
      interfaceId: number | null | undefined,
      direction: "in" | "out",
    ): number => {
      if (typeof interfaceId !== "number") {
        return 0;
      }

      const samples = statisticsMap.get(interfaceId);

      if (!samples || samples.length < 2) {
        return 0;
      }

      const current = samples[0];
      const previous = samples[1];

      const elapsedSeconds =
        (current.createdAt.getTime() - previous.createdAt.getTime()) / 1000;

      if (elapsedSeconds <= 0) {
        return 0;
      }

      return direction === "in"
        ? calculateRate(current.inOctets, previous.inOctets, elapsedSeconds)
        : calculateRate(current.outOctets, previous.outOctets, elapsedSeconds);
    };

    // --------------------------------------------------
    // 8. Incoming edge map
    //
    // targetNodeId -> edges entering that node
    // --------------------------------------------------

    const incomingEdges = new Map<string, typeof edges>();

    for (const edge of edges) {
      const existing = incomingEdges.get(edge.targetNodeId);

      if (existing) {
        existing.push(edge);
      } else {
        incomingEdges.set(edge.targetNodeId, [edge]);
      }
    }

    // --------------------------------------------------
    // 9. Get aggregation assigned to a handle
    // --------------------------------------------------

    const getHandleAggregationId = (
      nodeId: string,
      handleId: string | null | undefined,
    ): string | undefined => {
      if (!handleId) {
        return undefined;
      }

      const nodeData = nodeById.get(nodeId);

      if (!nodeData) {
        return undefined;
      }

      for (const handles of Object.values(nodeData.handles ?? {})) {
        const handle = handles?.find((item) => item.id === handleId);

        if (handle) {
          return handle.aggregationId;
        }
      }

      return undefined;
    };

    // --------------------------------------------------
    // 10. Calculate traffic recursively
    // --------------------------------------------------

    const calculateEdgeTraffic = (
      edge: (typeof edges)[number],
      visited = new Set<string>(),
    ): {
      inbound: number;
      outbound: number;
      aggregatedInterfaces: AggregatedInterfaceTraffic[];
    } => {
      const data = edge.data as TopologyEdgeData;

      // Prevent cycles
      if (visited.has(edge.edgeId)) {
        return {
          inbound: 0,
          outbound: 0,
          aggregatedInterfaces: [],
        };
      }

      const nextVisited = new Set(visited);
      nextVisited.add(edge.edgeId);

      const sourceIsBlank = isBlankNode(edge.sourceNodeId);
      const targetIsBlank = isBlankNode(edge.targetNodeId);

      // ------------------------------------------------
      // NORMAL → NORMAL
      // ------------------------------------------------

      if (!sourceIsBlank && !targetIsBlank) {
        const inbound = getRate(data.sourceInterfaceId, "in");

        const outbound = getRate(data.sourceInterfaceId, "out");

        return {
          inbound,
          outbound,

          aggregatedInterfaces:
            typeof data.sourceInterfaceId === "number"
              ? [
                  {
                    interfaceId: data.sourceInterfaceId,
                    interfaceName: data.sourceInterfaceName ?? "",
                    inbound,
                    outbound,
                  },
                ]
              : [],
        };
      }

      // ------------------------------------------------
      // NORMAL → BLANK
      //
      // This is an interface entering an aggregation
      // node.
      // ------------------------------------------------

      if (!sourceIsBlank && targetIsBlank) {
        const inbound = getRate(data.sourceInterfaceId, "in");

        const outbound = getRate(data.sourceInterfaceId, "out");

        return {
          inbound,
          outbound,

          aggregatedInterfaces:
            typeof data.sourceInterfaceId === "number"
              ? [
                  {
                    interfaceId: data.sourceInterfaceId,
                    interfaceName: data.sourceInterfaceName ?? "",
                    inbound,
                    outbound,
                  },
                ]
              : [],
        };
      }

      // ------------------------------------------------
      // BLANK → NORMAL
      //
      // IMPORTANT:
      //
      // Only interfaces belonging to the aggregation
      // assigned to THIS source handle are included.
      // ------------------------------------------------

      if (sourceIsBlank && !targetIsBlank) {
        const sourceNode = nodeById.get(edge.sourceNodeId);

        const aggregationMode = sourceNode?.aggregationMode;

        const aggregationId =
          aggregationMode === "manual"
            ? getHandleAggregationId(edge.sourceNodeId, edge.sourceHandle)
            : undefined;

        const incoming = incomingEdges.get(edge.sourceNodeId) ?? [];

        let inbound = 0;
        let outbound = 0;

        const aggregatedInterfaces: AggregatedInterfaceTraffic[] = [];

        // ------------------------------------------------
        // MANUAL AGGREGATION
        // ------------------------------------------------

        if (aggregationMode === "manual" && aggregationId) {
          const aggregation = sourceNode?.aggregations?.find(
            (agg) => agg.id === aggregationId,
          );

          if (aggregation) {
            const allowedInterfaceIds = new Set<number>();

            for (const iface of aggregation.interfaces) {
              if (typeof iface.interfaceId === "number") {
                allowedInterfaceIds.add(iface.interfaceId);
              }
            }

            for (const incomingEdge of incoming) {
              const incomingData = incomingEdge.data as TopologyEdgeData;

              const interfaceId = incomingData.sourceInterfaceId;

              if (typeof interfaceId !== "number") {
                continue;
              }

              // ------------------------------------------
              // THIS IS THE IMPORTANT FILTER
              // ------------------------------------------

              if (!allowedInterfaceIds.has(interfaceId)) {
                continue;
              }

              const interfaceInbound = getRate(interfaceId, "in");

              const interfaceOutbound = getRate(interfaceId, "out");

              inbound += interfaceInbound;
              outbound += interfaceOutbound;

              const aggregationInterface = aggregation.interfaces.find(
                (iface) => iface.interfaceId === interfaceId,
              );

              aggregatedInterfaces.push({
                interfaceId,

                interfaceName:
                  aggregationInterface?.interfaceName ??
                  incomingData.sourceInterfaceName ??
                  "",

                inbound: interfaceInbound,
                outbound: interfaceOutbound,
              });
            }
          }
        }

        // ------------------------------------------------
        // AUTOMATIC AGGREGATION
        // ------------------------------------------------
        else {
          for (const incomingEdge of incoming) {
            const traffic = calculateEdgeTraffic(incomingEdge, nextVisited);

            inbound += traffic.inbound;
            outbound += traffic.outbound;

            aggregatedInterfaces.push(...traffic.aggregatedInterfaces);
          }
        }

        return {
          inbound,
          outbound,
          aggregatedInterfaces,
        };
      }

      // ------------------------------------------------
      // BLANK → BLANK
      //
      // Pass aggregation traffic through another
      // blank node.
      // ------------------------------------------------

      if (sourceIsBlank && targetIsBlank) {
        const incoming = incomingEdges.get(edge.sourceNodeId) ?? [];

        let inbound = 0;
        let outbound = 0;

        const aggregatedInterfaces: AggregatedInterfaceTraffic[] = [];

        for (const incomingEdge of incoming) {
          const traffic = calculateEdgeTraffic(incomingEdge, nextVisited);

          inbound += traffic.inbound;
          outbound += traffic.outbound;

          aggregatedInterfaces.push(...traffic.aggregatedInterfaces);
        }

        return {
          inbound,
          outbound,
          aggregatedInterfaces,
        };
      }

      return {
        inbound: 0,
        outbound: 0,
        aggregatedInterfaces: [],
      };
    };

    // --------------------------------------------------
    // 11. Calculate every topology edge
    // --------------------------------------------------

    const traffic: Record<
      string,
      {
        inbound: number;
        outbound: number;
        aggregatedInterfaces: AggregatedInterfaceTraffic[];
      }
    > = {};

    for (const edge of edges) {
      traffic[edge.edgeId] = calculateEdgeTraffic(edge);
    }

    // --------------------------------------------------
    // 12. Response
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      data: traffic,
    });
  } catch (error) {
    console.error("TOPOLOGY TRAFFIC ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load topology traffic",
      },
      {
        status: 500,
      },
    );
  }
}
