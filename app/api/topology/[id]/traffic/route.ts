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

type TopologyHandle = {
  id: string;
  interfaceId?: number;
  interfaceName?: string;
  nodeName?: string;
  aggregationId?: string;
};
interface TrafficHandle {
  id: string;
  interfaceId?: number;
  interfaceName?: string;
  nodeName?: string;
  aggregationId?: string;
}

interface TrafficAggregation {
  id: string;
  name: string;
  interfaces: TrafficHandle[];
  connectedAggregations?: {
    id: string;
    name: string;
  }[];
}

interface TrafficNodeData {
  nodeType?: string;
  aggregationMode?: string;
  handles?: Record<string, TrafficHandle[]>;
  aggregations?: TrafficAggregation[];
}
export interface AggregatedInterfaceTraffic {
  interfaceId: number;
  interfaceName: string;
  inbound: number;
  outbound: number;
}
interface TopologyAggregation {
  id: string;
  name: string;
  interfaces: TopologyHandle[];
  connectedAggregations?: {
    id: string;
    name: string;
  }[];
}

interface NodeData {
  nodeType?: string;
  aggregationMode?: string;
  handles?: Record<string, TopologyHandle[]>;
  aggregations?: TopologyAggregation[];
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

    // --------------------------------------------------
    // 1. VALIDATE ID
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
    // 2. GET TOPOLOGY NODES
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
    // 3. GET TOPOLOGY EDGES
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
    // 4. NODE LOOKUP
    // --------------------------------------------------

    const nodeById = new Map<string, TrafficNodeData>(
      nodes.map((node) => [node.nodeId, node.data as TrafficNodeData]),
    );

    // --------------------------------------------------
    // 5. BLANK NODE CHECK
    // --------------------------------------------------

    const isBlankNodeType = (nodeType?: string) => {
      return (
        nodeType === "blank" || nodeType === "blank1" || nodeType === "blank2"
      );
    };

    const isBlankNode = (nodeId: string) => {
      return isBlankNodeType(nodeById.get(nodeId)?.nodeType);
    };

    // --------------------------------------------------
    // 6. HANDLE LOOKUP
    // --------------------------------------------------

    const getHandle = (
      nodeId: string,
      handleId: string | null | undefined,
    ): TrafficHandle | undefined => {
      if (!handleId) {
        return undefined;
      }

      const nodeData = nodeById.get(nodeId);

      if (!nodeData?.handles) {
        return undefined;
      }

      for (const handles of Object.values(nodeData.handles)) {
        const handle = handles?.find((item) => item.id === handleId);

        if (handle) {
          return handle;
        }
      }

      return undefined;
    };

    // --------------------------------------------------
    // 8. AGGREGATION LOOKUP
    //
    // aggregationId -> {
    //   nodeId,
    //   aggregation
    // }
    // --------------------------------------------------

    const aggregationById = new Map<
      string,
      {
        nodeId: string;
        aggregation: TrafficAggregation;
      }
    >();

    for (const node of nodes) {
      const nodeData = node.data as TrafficNodeData;

      for (const aggregation of nodeData.aggregations ?? []) {
        aggregationById.set(aggregation.id, {
          nodeId: node.nodeId,
          aggregation,
        });
      }
    }

    // --------------------------------------------------
    // 9. RECURSIVELY RESOLVE AGGREGATION INTERFACES
    //
    // This is the NEW calculation.
    //
    // Direct interfaces:
    //
    // aggregation.interfaces
    //
    // PLUS:
    //
    // aggregation.connectedAggregations
    //
    // recursively.
    // --------------------------------------------------

    const getAggregationInterfaceIds = (
      nodeId: string,
      aggregationId: string,
      visited = new Set<string>(),
    ): Set<number> => {
      const result = new Set<number>();

      const visitKey = `${nodeId}:${aggregationId}`;

      // ------------------------------------------------
      // Prevent circular aggregation references
      // ------------------------------------------------

      if (visited.has(visitKey)) {
        console.warn(`[AGGREGATION] Circular reference detected: ${visitKey}`);

        return result;
      }

      const nextVisited = new Set(visited);
      nextVisited.add(visitKey);

      // ------------------------------------------------
      // Find actual aggregation
      // ------------------------------------------------

      const aggregationRecord = aggregationById.get(aggregationId);

      if (!aggregationRecord) {
        console.warn(`[AGGREGATION] Aggregation not found`, {
          nodeId,
          aggregationId,
        });

        return result;
      }

      const aggregation = aggregationRecord.aggregation;

      console.log(
        `\n========== AGGREGATION ==========\n` +
          `Node: ${aggregationRecord.nodeId}\n` +
          `Aggregation: ${aggregation.name}\n` +
          `ID: ${aggregation.id}`,
      );

      // ------------------------------------------------
      // 1. DIRECT INTERFACES
      // ------------------------------------------------

      console.log(
        `[AGGREGATION] Direct interfaces in "${aggregation.name}":`,
        aggregation.interfaces ?? [],
      );

      for (const iface of aggregation.interfaces ?? []) {
        if (typeof iface.interfaceId !== "number") {
          continue;
        }

        result.add(iface.interfaceId);

        console.log(`[AGGREGATION] + Interface`, {
          interfaceId: iface.interfaceId,
          interfaceName: iface.interfaceName,
          nodeName: iface.nodeName,
          aggregation: aggregation.name,
        });
      }

      // ------------------------------------------------
      // 2. CONNECTED AGGREGATIONS
      // ------------------------------------------------

      console.log(
        `[AGGREGATION] Connected aggregations in "${aggregation.name}":`,
        aggregation.connectedAggregations ?? [],
      );

      for (const connectedAggregation of aggregation.connectedAggregations ??
        []) {
        if (!connectedAggregation?.id) {
          continue;
        }

        console.log(`[AGGREGATION] Looking for connected aggregation:`, {
          id: connectedAggregation.id,
          name: connectedAggregation.name,
        });

        const connectedRecord = aggregationById.get(connectedAggregation.id);

        if (!connectedRecord) {
          console.warn(
            `[AGGREGATION] Connected aggregation NOT FOUND:`,
            connectedAggregation.id,
          );

          continue;
        }

        console.log(`[AGGREGATION] Connected aggregation FOUND:`, {
          id: connectedRecord.aggregation.id,
          name: connectedRecord.aggregation.name,
          nodeId: connectedRecord.nodeId,
        });

        // ------------------------------------------------
        // RECURSIVELY GET INTERFACES
        // ------------------------------------------------

        const connectedInterfaceIds = getAggregationInterfaceIds(
          connectedRecord.nodeId,
          connectedRecord.aggregation.id,
          nextVisited,
        );

        for (const interfaceId of connectedInterfaceIds) {
          result.add(interfaceId);
        }
      }

      console.log(
        `[AGGREGATION] FINAL interfaces for "${aggregation.name}":`,
        Array.from(result),
      );

      return result;
    };

    // --------------------------------------------------
    // 10. COLLECT ALL INTERFACE IDS
    //
    // Includes:
    //
    // - normal edge sourceInterfaceId
    // - blank handle interfaceId
    // - explicit aggregation interfaces
    // - recursively connected aggregations
    // - automatic aggregation incoming interfaces
    // --------------------------------------------------

    const interfaceIds = new Set<number>();

    for (const edge of edges) {
      const data = edge.data as TopologyEdgeData;

      // ==================================================
      // NORMAL SOURCE INTERFACE
      // ==================================================

      if (typeof data.sourceInterfaceId === "number") {
        interfaceIds.add(data.sourceInterfaceId);
      }

      // ==================================================
      // NORMAL TARGET INTERFACE
      // ==================================================

      if (typeof data.targetInterfaceId === "number") {
        interfaceIds.add(data.targetInterfaceId);
      }

      // ==================================================
      // BLANK SOURCE HANDLE
      // ==================================================

      if (isBlankNode(edge.sourceNodeId)) {
        const sourceHandle = getHandle(edge.sourceNodeId, edge.sourceHandle);

        if (sourceHandle) {
          // ----------------------------------------------
          // Direct interface assigned to handle
          // ----------------------------------------------

          if (typeof sourceHandle.interfaceId === "number") {
            interfaceIds.add(sourceHandle.interfaceId);
          }

          // ----------------------------------------------
          // Explicit aggregation assigned to handle
          // ----------------------------------------------

          if (sourceHandle.aggregationId) {
            const aggregationInterfaceIds = getAggregationInterfaceIds(
              edge.sourceNodeId,
              sourceHandle.aggregationId,
            );

            for (const interfaceId of aggregationInterfaceIds) {
              interfaceIds.add(interfaceId);
            }
          }
        }
      }

      // ==================================================
      // BLANK TARGET HANDLE
      // ==================================================

      if (isBlankNode(edge.targetNodeId)) {
        const targetHandle = getHandle(edge.targetNodeId, edge.targetHandle);

        if (targetHandle) {
          // ----------------------------------------------
          // Direct interface assigned to handle
          // ----------------------------------------------

          if (typeof targetHandle.interfaceId === "number") {
            interfaceIds.add(targetHandle.interfaceId);
          }

          // ----------------------------------------------
          // Explicit aggregation assigned to handle
          // ----------------------------------------------

          if (targetHandle.aggregationId) {
            const aggregationInterfaceIds = getAggregationInterfaceIds(
              edge.targetNodeId,
              targetHandle.aggregationId,
            );

            for (const interfaceId of aggregationInterfaceIds) {
              interfaceIds.add(interfaceId);
            }
          }
        }
      }
    }

    // ==================================================
    // AUTOMATIC AGGREGATION
    //
    // Collect the same interfaces that the updated
    // calculateEdgeTraffic() will use.
    // ==================================================

    for (const edge of edges) {
      if (!isBlankNode(edge.sourceNodeId)) {
        continue;
      }

      const sourceHandle = getHandle(edge.sourceNodeId, edge.sourceHandle);

      // ------------------------------------------------
      // Explicit handle interface / aggregation already
      // handled above.
      // ------------------------------------------------

      if (sourceHandle?.interfaceId != null) {
        continue;
      }

      if (sourceHandle?.aggregationId) {
        continue;
      }

      // ------------------------------------------------
      // Find source node
      // ------------------------------------------------

      const sourceNode = nodeById.get(edge.sourceNodeId);

      if (sourceNode?.aggregationMode !== "automatic") {
        continue;
      }

      // ------------------------------------------------
      // Incoming edges
      // ------------------------------------------------

      for (const incomingEdge of edges) {
        if (incomingEdge.targetNodeId !== edge.sourceNodeId) {
          continue;
        }

        // ----------------------------------------------
        // Incoming normal node
        // ----------------------------------------------

        if (!isBlankNode(incomingEdge.sourceNodeId)) {
          const incomingData = incomingEdge.data as TopologyEdgeData;

          if (typeof incomingData.sourceInterfaceId === "number") {
            interfaceIds.add(incomingData.sourceInterfaceId);
          }

          continue;
        }

        // ----------------------------------------------
        // Incoming blank node
        // ----------------------------------------------

        const incomingHandle = getHandle(
          incomingEdge.sourceNodeId,
          incomingEdge.sourceHandle,
        );

        if (!incomingHandle) {
          continue;
        }

        // ----------------------------------------------
        // Incoming aggregation
        // ----------------------------------------------

        if (incomingHandle.aggregationId) {
          const nestedInterfaceIds = getAggregationInterfaceIds(
            incomingEdge.sourceNodeId,
            incomingHandle.aggregationId,
          );

          for (const interfaceId of nestedInterfaceIds) {
            interfaceIds.add(interfaceId);
          }

          continue;
        }

        // ----------------------------------------------
        // Incoming direct interface
        // ----------------------------------------------

        if (typeof incomingHandle.interfaceId === "number") {
          interfaceIds.add(incomingHandle.interfaceId);
        }
      }
    }

    // ==================================================
    // ALSO RESOLVE ALL AGGREGATIONS
    // ==================================================

    for (const node of nodes) {
      const nodeData = node.data as NodeData;

      for (const aggregation of nodeData.aggregations ?? []) {
        const aggregationInterfaceIds = getAggregationInterfaceIds(
          node.nodeId,
          aggregation.id,
        );

        for (const interfaceId of aggregationInterfaceIds) {
          interfaceIds.add(interfaceId);
        }
      }
    }

    console.log(
      "\n============================================================",
    );

    console.log("[INTERFACES] ALL INTERFACE IDs USED BY TOPOLOGY:");

    console.log(Array.from(interfaceIds));

    console.log(
      "============================================================\n",
    );

    // --------------------------------------------------
    // 11. LOAD STATISTICS
    // --------------------------------------------------

    const interfaceIdList = Array.from(interfaceIds);

    const statistics =
      interfaceIdList.length > 0
        ? await prisma.interface_statistics.findMany({
            where: {
              interfaceId: {
                in: interfaceIdList,
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
          })
        : [];

    // --------------------------------------------------
    // 12. KEEP LATEST 2 SAMPLES
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
    // 13. CALCULATE INTERFACE RATE
    // --------------------------------------------------

    // --------------------------------------------------
    // 13. CALCULATE INTERFACE RATE
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
        console.log(
          `[TRAFFIC] Interface ${interfaceId}: insufficient statistics`,
        );

        return 0;
      }

      const current = samples[0];
      const previous = samples[1];

      const elapsedSeconds =
        (current.createdAt.getTime() - previous.createdAt.getTime()) / 1000;

      if (elapsedSeconds <= 0) {
        return 0;
      }

      const currentOctets =
        direction === "in" ? current.inOctets : current.outOctets;

      const previousOctets =
        direction === "in" ? previous.inOctets : previous.outOctets;

      if (currentOctets < previousOctets) {
        console.warn(
          `[TRAFFIC] Counter reset detected for interface ${interfaceId}`,
        );

        return 0;
      }

      return calculateRate(currentOctets, previousOctets, elapsedSeconds);
    };

    // --------------------------------------------------
    // 14. GET SOURCE INTERFACE ID
    //
    // Normal nodes use the edge's sourceInterfaceId.
    // --------------------------------------------------

    const getSourceInterfaceId = (
      edge: (typeof edges)[number],
    ): number | undefined => {
      const data = edge.data as TopologyEdgeData;

      return typeof data.sourceInterfaceId === "number"
        ? data.sourceInterfaceId
        : undefined;
    };

    // --------------------------------------------------
    // 15. CALCULATE AGGREGATION TRAFFIC
    // --------------------------------------------------

    const calculateAggregationTraffic = (
      nodeId: string,
      aggregationId: string,
    ): {
      inbound: number;
      outbound: number;
      aggregatedInterfaces: AggregatedInterfaceTraffic[];
    } => {
      const aggregationInterfaceIds = getAggregationInterfaceIds(
        nodeId,
        aggregationId,
      );

      let inbound = 0;
      let outbound = 0;

      const aggregatedInterfaces: AggregatedInterfaceTraffic[] = [];

      console.log(
        "\n============================================================",
      );

      console.log(`[AGGREGATION TRAFFIC] Calculating aggregation`);

      console.log({
        nodeId,
        aggregationId,
        interfaceIds: Array.from(aggregationInterfaceIds),
      });

      console.log(
        "============================================================",
      );

      for (const interfaceId of aggregationInterfaceIds) {
        const interfaceInbound = getRate(interfaceId, "in");

        const interfaceOutbound = getRate(interfaceId, "out");

        inbound += interfaceInbound;
        outbound += interfaceOutbound;

        // ------------------------------------------------
        // Find interface metadata
        // ------------------------------------------------

        let interfaceName = "";

        const aggregationRecord = aggregationById.get(aggregationId);

        if (aggregationRecord) {
          const directInterface =
            aggregationRecord.aggregation.interfaces?.find(
              (iface) => iface.interfaceId === interfaceId,
            );

          if (directInterface) {
            interfaceName = directInterface.interfaceName ?? "";
          }
        }

        // ------------------------------------------------
        // Search nested aggregations if necessary
        // ------------------------------------------------

        if (!interfaceName) {
          const visitedAggregations = new Set<string>();

          const findInterfaceName = (currentAggregationId: string): string => {
            if (visitedAggregations.has(currentAggregationId)) {
              return "";
            }

            visitedAggregations.add(currentAggregationId);

            const record = aggregationById.get(currentAggregationId);

            if (!record) {
              return "";
            }

            const direct = record.aggregation.interfaces?.find(
              (iface) => iface.interfaceId === interfaceId,
            );

            if (direct) {
              return direct.interfaceName ?? "";
            }

            for (const connected of record.aggregation.connectedAggregations ??
              []) {
              if (!connected?.id) {
                continue;
              }

              const name = findInterfaceName(connected.id);

              if (name) {
                return name;
              }
            }

            return "";
          };

          interfaceName = findInterfaceName(aggregationId);
        }

        aggregatedInterfaces.push({
          interfaceId,
          interfaceName,
          inbound: interfaceInbound,
          outbound: interfaceOutbound,
        });

        console.log(`[AGGREGATION TRAFFIC] Interface ${interfaceId}`, {
          inbound: interfaceInbound,
          outbound: interfaceOutbound,
        });
      }

      console.log(`[AGGREGATION TRAFFIC] FINAL`, {
        nodeId,
        aggregationId,
        interfaces: Array.from(aggregationInterfaceIds),
        inbound,
        outbound,
      });

      return {
        inbound,
        outbound,
        aggregatedInterfaces,
      };
    };

    // --------------------------------------------------
    // 16. CALCULATE EDGE TRAFFIC
    //
    // THIS FOLLOWS YOUR UPDATED LOGIC EXACTLY.
    // --------------------------------------------------

    const calculateEdgeTraffic = (
      edge: (typeof edges)[number],
    ): {
      inbound: number;
      outbound: number;
      aggregatedInterfaces: AggregatedInterfaceTraffic[];
    } => {
      const sourceIsBlank = isBlankNode(edge.sourceNodeId);

      // ==========================================================
      // NORMAL SOURCE NODE
      // ==========================================================

      if (!sourceIsBlank) {
        const sourceInterfaceId = getSourceInterfaceId(edge);

        const inbound = getRate(sourceInterfaceId, "in");

        const outbound = getRate(sourceInterfaceId, "out");

        const data = edge.data as TopologyEdgeData;

        console.log(`[EDGE TRAFFIC] Normal node edge ${edge.edgeId}`, {
          sourceInterfaceId,
          inbound,
          outbound,
        });

        return {
          inbound,
          outbound,

          aggregatedInterfaces:
            typeof sourceInterfaceId === "number"
              ? [
                  {
                    interfaceId: sourceInterfaceId,
                    interfaceName: data.sourceInterfaceName ?? "",
                    inbound,
                    outbound,
                  },
                ]
              : [],
        };
      }

      // ==========================================================
      // BLANK SOURCE NODE
      // ==========================================================

      const sourceHandle = getHandle(edge.sourceNodeId, edge.sourceHandle);

      // ==========================================================
      // 1. EXPLICIT AGGREGATION
      // ==========================================================

      if (sourceHandle?.aggregationId) {
        console.log(`\n[EDGE TRAFFIC] Edge ${edge.edgeId} uses aggregation`, {
          nodeId: edge.sourceNodeId,
          aggregationId: sourceHandle.aggregationId,
        });

        const traffic = calculateAggregationTraffic(
          edge.sourceNodeId,
          sourceHandle.aggregationId,
        );

        return {
          inbound: traffic.inbound,
          outbound: traffic.outbound,
          aggregatedInterfaces: traffic.aggregatedInterfaces,
        };
      }

      // ==========================================================
      // 2. DIRECT SOURCE HANDLE INTERFACE
      // ==========================================================

      if (typeof sourceHandle?.interfaceId === "number") {
        const interfaceId = sourceHandle.interfaceId;

        const inbound = getRate(interfaceId, "in");

        const outbound = getRate(interfaceId, "out");

        console.log(`[EDGE TRAFFIC] Blank direct interface`, {
          edgeId: edge.edgeId,
          interfaceId,
          interfaceName: sourceHandle.interfaceName,
          inbound,
          outbound,
        });

        return {
          inbound,
          outbound,

          aggregatedInterfaces: [
            {
              interfaceId,
              interfaceName: sourceHandle.interfaceName ?? "",
              inbound,
              outbound,
            },
          ],
        };
      }

      // ==========================================================
      // FIND SOURCE NODE
      // ==========================================================

      const sourceNode = nodes.find(
        (node) => node.nodeId === edge.sourceNodeId,
      );

      const sourceNodeData = sourceNode?.data as {
        aggregationMode?: string;
      };

      // ==========================================================
      // 3. MANUAL NODE
      // ==========================================================

      if (sourceNodeData?.aggregationMode !== "automatic") {
        console.log(`[EDGE TRAFFIC] Manual blank node - no aggregation`, {
          edgeId: edge.edgeId,
          nodeId: edge.sourceNodeId,
        });

        return {
          inbound: 0,
          outbound: 0,
          aggregatedInterfaces: [],
        };
      }

      // ==========================================================
      // 4. AUTOMATIC AGGREGATION
      //
      // IMPORTANT:
      //
      // We collect interface IDs from incoming edges.
      // We DO NOT recursively call calculateEdgeTraffic().
      // ==========================================================

      const automaticInterfaceIds = new Set<number>();

      for (const incomingEdge of edges) {
        if (incomingEdge.targetNodeId !== edge.sourceNodeId) {
          continue;
        }

        // --------------------------------------------------------
        // Incoming normal node
        // --------------------------------------------------------

        if (!isBlankNode(incomingEdge.sourceNodeId)) {
          const incomingData = incomingEdge.data as TopologyEdgeData;

          if (typeof incomingData.sourceInterfaceId === "number") {
            automaticInterfaceIds.add(incomingData.sourceInterfaceId);
          }

          continue;
        }

        // --------------------------------------------------------
        // Incoming blank node
        // --------------------------------------------------------

        const incomingHandle = getHandle(
          incomingEdge.sourceNodeId,
          incomingEdge.sourceHandle,
        );

        if (!incomingHandle) {
          continue;
        }

        // --------------------------------------------------------
        // Incoming aggregation
        // --------------------------------------------------------

        if (incomingHandle.aggregationId) {
          const nestedInterfaceIds = getAggregationInterfaceIds(
            incomingEdge.sourceNodeId,
            incomingHandle.aggregationId,
          );

          for (const interfaceId of nestedInterfaceIds) {
            automaticInterfaceIds.add(interfaceId);
          }

          continue;
        }

        // --------------------------------------------------------
        // Incoming direct interface
        // --------------------------------------------------------

        if (typeof incomingHandle.interfaceId === "number") {
          automaticInterfaceIds.add(incomingHandle.interfaceId);
        }
      }

      // ==========================================================
      // CALCULATE AUTOMATIC TRAFFIC
      // ==========================================================

      let inbound = 0;
      let outbound = 0;

      const aggregatedInterfaces: AggregatedInterfaceTraffic[] = [];

      console.log(`[EDGE TRAFFIC] Automatic aggregation`, {
        edgeId: edge.edgeId,
        nodeId: edge.sourceNodeId,
        interfaceIds: Array.from(automaticInterfaceIds),
      });

      for (const interfaceId of automaticInterfaceIds) {
        const interfaceInbound = getRate(interfaceId, "in");

        const interfaceOutbound = getRate(interfaceId, "out");

        inbound += interfaceInbound;
        outbound += interfaceOutbound;

        aggregatedInterfaces.push({
          interfaceId,
          interfaceName: "",
          inbound: interfaceInbound,
          outbound: interfaceOutbound,
        });
      }

      console.log(`[EDGE TRAFFIC] Automatic aggregation FINAL`, {
        edgeId: edge.edgeId,
        interfaceIds: Array.from(automaticInterfaceIds),
        inbound,
        outbound,
      });

      return {
        inbound,
        outbound,
        aggregatedInterfaces,
      };
    };

    // --------------------------------------------------
    // 17. CALCULATE EVERY EDGE
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
    // 18. RESPONSE
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
