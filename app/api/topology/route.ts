import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
import type {
  TopologyNode,
  TopologyEdge,
} from "@/components/WeatherMapComponent";
import { prisma } from "@/lib/prisma";

interface SaveTopologyRequest {
  name: string;
  description?: string;
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

export async function GET() {
  try {
    const topology = await prisma.topologies.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(topology);
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
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SaveTopologyRequest;

    const { name, description, nodes, edges } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Topology name is required",
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(nodes)) {
      return NextResponse.json(
        {
          success: false,
          message: "Nodes must be an array",
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(edges)) {
      return NextResponse.json(
        {
          success: false,
          message: "Edges must be an array",
        },
        { status: 400 },
      );
    }
    const exist = await prisma.topologies.findUnique({
      where: {
        name,
      },
    });

    if (exist) {
      return NextResponse.json(
        {
          message: "Topology already exists.",
        },
        { status: 409 },
      );
    }
    const topology = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // ---------------------------------------------
        // Create topology
        // ---------------------------------------------

        const newTopology = await tx.topologies.create({
          data: {
            name,
            description: description ?? null,
          },
        });

        // ---------------------------------------------
        // Create nodes
        // ---------------------------------------------

        if (nodes.length > 0) {
          const nodeData = nodes.map((node: TopologyNode) => ({
            topologyId: newTopology.id,

            nodeId: node.id,

            type: node.type ?? "default",

            positionX: node.position.x,
            positionY: node.position.y,

            width: node.measured?.width ?? node.width ?? 150,

            height: node.measured?.height ?? node.height ?? 100,

            deviceId:
              typeof node.data.deviceId === "number"
                ? node.data.deviceId
                : null,

            interfaceId:
              typeof node.data.interfaceId === "number"
                ? node.data.interfaceId
                : null,

            data: node.data as Prisma.InputJsonValue,
          }));

          await tx.topology_nodes.createMany({
            data: nodeData,
          });
        }

        // ---------------------------------------------
        // Create edges
        // ---------------------------------------------

        if (edges.length > 0) {
          const edgeData = edges.map((edge: TopologyEdge) => ({
            topologyId: newTopology.id,

            edgeId: edge.id,

            sourceNodeId: edge.source,
            targetNodeId: edge.target,

            sourceHandle: edge.sourceHandle ?? null,
            targetHandle: edge.targetHandle ?? null,

            type: edge.type ?? null,

            data: edge.data as Prisma.InputJsonValue,
          }));

          await tx.topology_edges.createMany({
            data: edgeData,
          });
        }

        return newTopology;
      },
    );

    return NextResponse.json(
      {
        success: true,
        message: "Topology saved successfully",
        data: {
          id: topology.id,
          name: topology.name,
          description: topology.description,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("SAVE TOPOLOGY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to save topology",
      },
      { status: 500 },
    );
  }
}
