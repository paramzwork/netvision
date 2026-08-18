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
// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { TopologyNode } from "@/components/WeathermapComponent";
// import { Edge } from "@xyflow/react";

// export async function GET() {
//   try {
//     const [positions, links] = await Promise.all([
//       prisma.topology_positions.findMany({
//         include: {
//           interface: {
//             include: {
//               device: {
//                 include: {
//                   interfaces: {
//                     where: {
//                       status: "1",
//                     },
//                     orderBy: {
//                       index: "asc",
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//       }),

//       prisma.interface_links.findMany({
//         include: {
//           sourceInterface: {
//             include: {
//               device: true,
//               statistics: {
//                 orderBy: {
//                   createdAt: "desc",
//                 },
//                 take: 2,
//               },
//             },
//           },
//           targetInterface: {
//             include: {
//               device: true,
//               statistics: {
//                 orderBy: {
//                   createdAt: "desc",
//                 },
//                 take: 2,
//               },
//             },
//           },
//         },
//       }),
//     ]);
//     const serialized = JSON.parse(
//       JSON.stringify(
//         {
//           topology: positions,
//           links,
//         },
//         (_, value) => (typeof value === "bigint" ? value.toString() : value),
//       ),
//     );
//     return NextResponse.json(serialized);
//   } catch (error) {
//     console.error(error);

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to fetch topology.",
//       },
//       { status: 500 },
//     );
//   }
// }
// export async function POST(req: NextRequest) {
//   try {
//     const { nodes, edges } = await req.json();

//     // Remove all saved positions
//     await prisma.topology_positions.deleteMany();

//     // Recreate all positions
//     await prisma.topology_positions.createMany({
//       data: nodes.map((node: TopologyNode) => ({
//         interfaceId: Number(node.data.interfaceId),
//         x: node.position.x,
//         y: node.position.y,
//         width: node.measured?.width ?? node.width ?? 0,
//         height: node.measured?.height ?? node.height ?? 0,
//         topHandles: node.data.handles.top,
//         rightHandles: node.data.handles.right,
//         bottomHandles: node.data.handles.bottom,
//         leftHandles: node.data.handles.left,
//       })),
//     });

//     // Remove all existing links
//     await prisma.interface_links.deleteMany();

//     // Recreate current links
//     if (edges.length > 0) {
//       await prisma.interface_links.createMany({
//         data: edges.map((edge: Edge) => ({
//           sourceInterfaceId: Number(edge.source.split("-")[0]),
//           targetInterfaceId: Number(edge.target.split("-")[0]),
//           sourceHandle: edge.sourceHandle,
//           targetHandle: edge.targetHandle,
//           status: "Connected",
//         })),
//       });
//     }

//     return NextResponse.json({
//       success: true,
//       message: "Topology saved successfully.",
//     });
//   } catch (error) {
//     console.error(error);

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to save topology.",
//       },
//       { status: 500 },
//     );
//   }
// }
