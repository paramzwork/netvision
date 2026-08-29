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
interface AggregatedInterface {
  interfaceId: number;
  interfaceName: string;
  sourceNodeName: string;
  inbound: number;
  outbound: number;
}

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const topologyId = Number(id);

    // ============================================================
    // VALIDATE ID
    // ============================================================

    if (!Number.isInteger(topologyId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid topology ID",
        },
        { status: 400 },
      );
    }

    // ============================================================
    // LOAD TOPOLOGY
    // ============================================================

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

    // ============================================================
    // NODE LOOKUP
    // ============================================================

    const nodeById = new Map<
      string,
      {
        nodeName?: string;
        nodeType?: string;
      }
    >(
      topology.nodes.map((node) => {
        const data = node.data as {
          nodeName?: string;
          nodeType?: string;
        };

        return [
          node.nodeId,
          {
            nodeName: data.nodeName,
            nodeType: data.nodeType,
          },
        ];
      }),
    );

    // ============================================================
    // BLANK NODE CHECK
    // ============================================================

    const isBlankNodeType = (nodeType?: string) => {
      return (
        nodeType === "blank" || nodeType === "blank1" || nodeType === "blank2"
      );
    };

    const isBlankNode = (nodeId: string): boolean => {
      const node = nodeById.get(nodeId);

      return isBlankNodeType(node?.nodeType);
    };

    // ============================================================
    // GET HANDLE
    // ============================================================

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

    // ============================================================
    // GET SOURCE INTERFACE
    // ============================================================

    const getSourceInterfaceId = (
      edge: (typeof topology.edges)[number],
    ): number | undefined => {
      const data = edge.data as TopologyEdgeData;

      // Blank node -> interface comes from handle
      if (isBlankNode(edge.sourceNodeId)) {
        return (
          getHandle(edge.sourceNodeId, edge.sourceHandle)?.interfaceId ??
          undefined
        );
      }

      // Normal node -> interface comes from edge.data
      return data.sourceInterfaceId ?? undefined;
    };

    // ============================================================
    // GET TARGET INTERFACE
    // ============================================================

    const getTargetInterfaceId = (
      edge: (typeof topology.edges)[number],
    ): number | undefined => {
      const data = edge.data as TopologyEdgeData;

      // Blank node -> interface comes from handle
      if (isBlankNode(edge.targetNodeId)) {
        return (
          getHandle(edge.targetNodeId, edge.targetHandle)?.interfaceId ??
          undefined
        );
      }

      // Normal node -> interface comes from edge.data
      return data.targetInterfaceId ?? undefined;
    };

    // ============================================================
    // AGGREGATION LOOKUP
    //
    // Creates:
    //
    // aggregationId -> {
    //   nodeId,
    //   aggregation
    // }
    //
    // This makes connectedAggregations lookup much faster.
    // ============================================================

    const aggregationById = new Map<
      string,
      {
        nodeId: string;
        aggregation: AggregationGroup;
      }
    >();

    for (const node of topology.nodes) {
      const data = node.data as {
        aggregations?: AggregationGroup[];
      };

      for (const aggregation of data.aggregations ?? []) {
        aggregationById.set(aggregation.id, {
          nodeId: node.nodeId,
          aggregation,
        });
      }
    }
    const findAggregationInterface = (
      aggregationId: string,
      interfaceId: number,
      visited = new Set<string>(),
    ):
      | {
          interfaceName: string;
          sourceNodeName: string;
        }
      | undefined => {
      if (visited.has(aggregationId)) {
        return undefined;
      }

      const nextVisited = new Set(visited);
      nextVisited.add(aggregationId);

      const record = aggregationById.get(aggregationId);

      if (!record) {
        return undefined;
      }

      const directInterface = record.aggregation.interfaces?.find(
        (iface) => iface.interfaceId === interfaceId,
      );

      if (directInterface) {
        return {
          interfaceName: directInterface.interfaceName ?? "",

          sourceNodeName: directInterface.nodeName ?? "",
        };
      }

      for (const connectedAggregation of record.aggregation
        .connectedAggregations ?? []) {
        if (!connectedAggregation?.id) {
          continue;
        }

        const result = findAggregationInterface(
          connectedAggregation.id,
          interfaceId,
          nextVisited,
        );

        if (result) {
          return result;
        }
      }

      return undefined;
    };

    // ============================================================
    // RESOLVE AGGREGATION INTERFACES
    //
    // IMPORTANT:
    //
    // aggregation.interfaces
    //
    // +
    //
    // aggregation.connectedAggregations
    //
    // For every connected aggregation:
    //
    // connectedAggregation.id
    //
    // is used to FIND the actual aggregation object.
    //
    // Then its interfaces are collected recursively.
    // ============================================================

    const getAggregationInterfaceIds = (
      nodeId: string,
      aggregationId: string,
      visited = new Set<string>(),
    ): Set<number> => {
      const result = new Set<number>();

      const visitKey = `${nodeId}:${aggregationId}`;

      // ------------------------------------------------------------
      // Prevent circular aggregation references
      // ------------------------------------------------------------

      if (visited.has(visitKey)) {
        console.warn(`[AGGREGATION] Circular reference detected: ${visitKey}`);

        return result;
      }

      const nextVisited = new Set(visited);
      nextVisited.add(visitKey);

      // ------------------------------------------------------------
      // Find aggregation
      // ------------------------------------------------------------

      const aggregationRecord = aggregationById.get(aggregationId);

      if (!aggregationRecord) {
        console.warn(`[AGGREGATION] Aggregation not found`, {
          nodeId,
          aggregationId,
        });

        return result;
      }

      const aggregation = aggregationRecord.aggregation;

      // ------------------------------------------------------------
      // LOG CURRENT AGGREGATION
      // ------------------------------------------------------------

      console.log(
        `\n========== AGGREGATION ==========\n` +
          `Node: ${nodeId}\n` +
          `Aggregation: ${aggregation.name}\n` +
          `ID: ${aggregation.id}`,
      );

      // ------------------------------------------------------------
      // 1. DIRECT INTERFACES
      // ------------------------------------------------------------

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

      // ------------------------------------------------------------
      // 2. CONNECTED AGGREGATIONS
      // ------------------------------------------------------------

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

        // ----------------------------------------------------------
        // FIND ACTUAL AGGREGATION USING ID
        // ----------------------------------------------------------

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

        // ----------------------------------------------------------
        // RECURSIVELY GET ITS INTERFACES
        // ----------------------------------------------------------

        const connectedInterfaceIds = getAggregationInterfaceIds(
          connectedRecord.nodeId,
          connectedRecord.aggregation.id,
          nextVisited,
        );

        console.log(
          `[AGGREGATION] Interfaces from connected aggregation "${connectedRecord.aggregation.name}":`,
          Array.from(connectedInterfaceIds),
        );

        // ----------------------------------------------------------
        // ADD TO RESULT
        // ----------------------------------------------------------

        for (const interfaceId of connectedInterfaceIds) {
          result.add(interfaceId);
        }
      }

      // ------------------------------------------------------------
      // FINAL RESULT FOR THIS AGGREGATION
      // ------------------------------------------------------------

      console.log(
        `[AGGREGATION] FINAL interfaces for "${aggregation.name}":`,
        Array.from(result),
      );

      return result;
    };

    // ============================================================
    // COLLECT ALL INTERFACE IDs
    // ============================================================

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

      // ----------------------------------------------------------
      // SOURCE AGGREGATION
      // ----------------------------------------------------------

      if (isBlankNode(edge.sourceNodeId)) {
        const sourceHandle = getHandle(edge.sourceNodeId, edge.sourceHandle);

        if (sourceHandle?.aggregationId) {
          const aggregationInterfaceIds = getAggregationInterfaceIds(
            edge.sourceNodeId,
            sourceHandle.aggregationId,
          );

          for (const interfaceId of aggregationInterfaceIds) {
            interfaceIds.add(interfaceId);
          }
        }
      }

      // ----------------------------------------------------------
      // TARGET AGGREGATION
      // ----------------------------------------------------------

      if (isBlankNode(edge.targetNodeId)) {
        const targetHandle = getHandle(edge.targetNodeId, edge.targetHandle);

        if (targetHandle?.aggregationId) {
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

    // ============================================================
    // ALSO COLLECT ALL AGGREGATION INTERFACES
    // ============================================================

    for (const node of topology.nodes) {
      const data = node.data as {
        aggregations?: AggregationGroup[];
      };

      for (const aggregation of data.aggregations ?? []) {
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

    // ============================================================
    // LOAD INTERFACE STATUS
    // ============================================================

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

    // ============================================================
    // SOURCE INTERFACES USED FOR TRAFFIC
    // ============================================================

    const sourceInterfaceIds = new Set<number>();

    for (const edge of topology.edges) {
      const sourceInterfaceId = getSourceInterfaceId(edge);

      // ----------------------------------------------------------
      // Direct source interface
      // ----------------------------------------------------------

      if (typeof sourceInterfaceId === "number") {
        sourceInterfaceIds.add(sourceInterfaceId);
      }

      // ----------------------------------------------------------
      // Aggregated source interface
      // ----------------------------------------------------------

      if (isBlankNode(edge.sourceNodeId)) {
        const sourceHandle = getHandle(edge.sourceNodeId, edge.sourceHandle);

        if (sourceHandle?.aggregationId) {
          const aggregationInterfaceIds = getAggregationInterfaceIds(
            edge.sourceNodeId,
            sourceHandle.aggregationId,
          );

          for (const interfaceId of aggregationInterfaceIds) {
            sourceInterfaceIds.add(interfaceId);
          }
        }
      }
    }

    console.log(
      "[TRAFFIC] Source interface IDs:",
      Array.from(sourceInterfaceIds),
    );

    // ============================================================
    // LOAD STATISTICS
    // ============================================================

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

    // ============================================================
    // GROUP STATISTICS BY INTERFACE
    // ============================================================

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

    // ============================================================
    // CALCULATE TRAFFIC
    // ============================================================

    const calculateTraffic = (
      interfaceId: number | null | undefined,
      direction: "in" | "out",
    ): number => {
      if (typeof interfaceId !== "number") {
        return 0;
      }

      const stats = statisticsByInterface.get(interfaceId);

      if (!stats || stats.length < 2) {
        console.log(
          `[TRAFFIC] Interface ${interfaceId}: insufficient statistics`,
        );

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

      // ----------------------------------------------------------
      // Counter reset protection
      // ----------------------------------------------------------

      if (currentOctets < previousOctets) {
        console.warn(
          `[TRAFFIC] Counter reset detected for interface ${interfaceId}`,
        );

        return 0;
      }

      const octetDifference = currentOctets - previousOctets;

      const bitsPerSecond = (Number(octetDifference) * 8) / elapsedSeconds;

      console.log(
        `[TRAFFIC] Interface ${interfaceId} ${direction.toUpperCase()}:`,
        {
          currentOctets: Number(currentOctets),
          previousOctets: Number(previousOctets),
          octetDifference: Number(octetDifference),
          elapsedSeconds,
          bitsPerSecond,
        },
      );

      return bitsPerSecond;
    };

    // ============================================================
    // CALCULATE AGGREGATION TRAFFIC
    // ============================================================

    const calculateAggregationTraffic = (
      nodeId: string,
      aggregationId: string,
    ): {
      inbound: number;
      outbound: number;
      aggregatedInterfaces: AggregatedInterface[];
    } => {
      const aggregationInterfaceIds = getAggregationInterfaceIds(
        nodeId,
        aggregationId,
      );

      let inbound = 0;
      let outbound = 0;
      const aggregatedInterfaces: AggregatedInterface[] = [];
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
        const interfaceInbound = calculateTraffic(interfaceId, "in");

        const interfaceOutbound = calculateTraffic(interfaceId, "out");

        inbound += interfaceInbound;
        outbound += interfaceOutbound;

        const metadata = findAggregationInterface(aggregationId, interfaceId);
        console.log(`[AGGREGATION TRAFFIC] Interface ${interfaceId}`, {
          inbound: interfaceInbound,
          outbound: interfaceOutbound,
        });
        aggregatedInterfaces.push({
          interfaceId,
          interfaceName: metadata?.interfaceName ?? "",
          sourceNodeName: metadata?.sourceNodeName ?? "",
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

    // ============================================================
    // CALCULATE EDGE TRAFFIC
    // ============================================================

    const calculateEdgeTraffic = (
      edge: (typeof topology.edges)[number],
    ): {
      inbound: number;
      outbound: number;
      aggregatedInterfaces: AggregatedInterface[];
    } => {
      const sourceIsBlank = isBlankNode(edge.sourceNodeId);

      // ==========================================================
      // NORMAL SOURCE NODE
      // ==========================================================

      if (!sourceIsBlank) {
        const sourceInterfaceId = getSourceInterfaceId(edge);

        const inbound = calculateTraffic(sourceInterfaceId, "in");

        const outbound = calculateTraffic(sourceInterfaceId, "out");

        console.log(`[EDGE TRAFFIC] Normal node edge ${edge.edgeId}`, {
          sourceInterfaceId,
          inbound,
          outbound,
        });

        const data = edge.data as TopologyEdgeData;

        return {
          inbound,
          outbound,

          aggregatedInterfaces:
            typeof sourceInterfaceId === "number"
              ? [
                  {
                    interfaceId: sourceInterfaceId,
                    interfaceName: data.sourceInterfaceName ?? "",
                    sourceNodeName:
                      nodeById.get(edge.sourceNodeId)?.nodeName ?? "",
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

        const inbound = calculateTraffic(interfaceId, "in");

        const outbound = calculateTraffic(interfaceId, "out");

        console.log(`[EDGE TRAFFIC] Blank direct interface`, {
          edgeId: edge.edgeId,
          interfaceId: sourceHandle.interfaceId,
          inbound,
          outbound,
        });

        return {
          inbound,
          outbound,

          aggregatedInterfaces: [
            {
              interfaceId: sourceHandle.interfaceId,
              interfaceName: sourceHandle.interfaceName ?? "",
              sourceNodeName: nodeById.get(edge.sourceNodeId)?.nodeName ?? "",
              inbound,
              outbound,
            },
          ],
        };
      }

      // ==========================================================
      // FIND SOURCE NODE
      // ==========================================================

      const sourceNode = topology.nodes.find(
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
      // ==========================================================

      const automaticInterfaceIds = new Set<number>();

      for (const incomingEdge of topology.edges) {
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
   const aggregatedInterfaces: AggregatedInterface[] = [];
      console.log(`[EDGE TRAFFIC] Automatic aggregation`, {
        edgeId: edge.edgeId,
        nodeId: edge.sourceNodeId,
        interfaceIds: Array.from(automaticInterfaceIds),
      });

      for (const interfaceId of automaticInterfaceIds) {
        const interfaceInbound = calculateTraffic(interfaceId, "in");

        const interfaceOutbound = calculateTraffic(interfaceId, "out");

        inbound += interfaceInbound;
        outbound += interfaceOutbound;
        aggregatedInterfaces.push({
          interfaceId,
          interfaceName: "",
          sourceNodeName: nodeById.get(edge.sourceNodeId)?.nodeName ?? "",
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

    // ============================================================
    // NODES
    // ============================================================

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

    // ============================================================
    // EDGES
    // ============================================================

    const edges = topology.edges.map((edge) => {
      const data = edge.data as TopologyEdgeData;

      // ----------------------------------------------------------
      // ACTUAL SOURCE/TARGET INTERFACES
      // ----------------------------------------------------------

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

      // ----------------------------------------------------------
      // TRAFFIC
      // ----------------------------------------------------------

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

          // ------------------------------------------------------
          // NODE NAMES
          // ------------------------------------------------------

          sourceNodeName: sourceNodeData?.nodeName ?? "Unknown",

          targetNodeName: targetNodeData?.nodeName ?? "Unknown",

          sourceDesc: data.sourceDesc,

          targetDesc: data.targetDesc,

          // ------------------------------------------------------
          // ACTUAL INTERFACE IDS
          // ------------------------------------------------------

          sourceInterfaceId,

          targetInterfaceId,

          // ------------------------------------------------------
          // TRAFFIC
          // ------------------------------------------------------

          inbound: traffic.inbound,

          outbound: traffic.outbound,

          // ------------------------------------------------------
          // SOURCE STATUS
          // ------------------------------------------------------

          sourceAdminStatus: sourceInterface?.adminStatus ?? 0,

          sourceOperStatus: sourceInterface?.operStatus ?? 0,

          sourceStatus: sourceInterface?.status ?? "",

          // ------------------------------------------------------
          // TARGET STATUS
          // ------------------------------------------------------

          targetAdminStatus: targetInterface?.adminStatus ?? 0,

          targetOperStatus: targetInterface?.operStatus ?? 0,

          targetStatus: targetInterface?.status ?? "",

          aggregatedInterfaces: traffic.aggregatedInterfaces,
        },
      };
    });

    // ============================================================
    // RESPONSE
    // ============================================================

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
