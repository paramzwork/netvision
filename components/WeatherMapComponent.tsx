"use client";

import {
  Background,
  MiniMap,
  ReactFlow,
  type Connection,
  type Edge,
  type OnReconnect,
  type NodeMouseHandler,
  useNodesState,
  useEdgesState,
  Node,
  reconnectEdge,
  EdgeTypes,
  OnNodeDrag,
  useReactFlow,
  applyNodeChanges,
  NodeChange,
  EdgeChange,
  applyEdgeChanges,
  EdgeMouseHandler,
} from "@xyflow/react";
import { useUpdateNodeInternals } from "@xyflow/react";

import NodeHandleSettings from "./NodeHandleSettings";
import { useCallback, useEffect, useRef, useState } from "react";
import CustomEdgeStartEnd, { EdgePosition } from "./CustomEdgeStartEnd";
import SidebarWeathermap from "./SidebarWeathermap";
import { useDevicesStore, useInterfacesWeathermap } from "@/store/device-store";
import { toast } from "sonner";
import { InterfaceTypes } from "@/lib/types";
import { tripleEncode } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { AggregationGroup, AggregationMode, useDnD } from "./DnDContext";
import SwitchNode from "./weathermap/nodes/SwitchNode";
import { Button } from "./ui/button";
import CloudNode from "./weathermap/nodes/CloudNode";
import { Input } from "./ui/input";
import ServerNode from "./weathermap/nodes/ServerNode";
import { AggregatedInterface } from "@/app/(pages)/settings/weathermap/[id]/page";
import RouterNodeSettings from "./weathermap/nodes/RouterNode";
const nodeTypes = {
  router: RouterNodeSettings,
  switch: SwitchNode,
  cloud: CloudNode,
  server: ServerNode,
  blank: CloudNode,
  blank1: RouterNodeSettings,
};
export const edgeTypes: EdgeTypes = {
  "start-end": CustomEdgeStartEnd,
};
export interface DeviceInterface {
  id: number;
  name: string;
  description: string;
  speedMbps?: number;
}
export interface HandleCounts {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
export type HandleType = "source" | "target";
export interface NodeHandle {
  id: string;
  interfaceId?: number;
  interfaceName: string;
  nodeName?: string;

  aggregationId?: string;
  // Traffic represented by this handle
  inbound?: number;
  outbound?: number;
  type: HandleType;
}

export interface HandleLayout {
  top: NodeHandle[];
  right: NodeHandle[];
  bottom: NodeHandle[];
  left: NodeHandle[];
}
export interface TrafficHistoryPoint {
  inbound: number;
  outbound: number;
  timestamp: number;
}
export interface TopologyNodeData extends Record<string, unknown> {
  interfaceId?: number;
  deviceId?: number;
  nodeName: string;
  nodeType?: string;
  label: string;
  ip: string;

  vendor?: string;
  model?: string;
  description: string;

  status?: string;

  //   interfaces: DeviceInterface[];

  /**
   * Undefined until the user configures the node.
   */
  handles: HandleLayout;
  // Aggregation configuration
  aggregationMode: AggregationMode;
  aggregations: AggregationGroup[];
}

export type TopologyNode = Node<TopologyNodeData>;
export interface TopologyEdgeData extends Record<string, unknown> {
  sourceInterfaceId?: number | null;
  sourceInterfaceName?: string;

  sourceNodeName?: string;
  sourceNodeType?: string;

  targetNodeName?: string;
  targetNodeType?: string;

  targetInterfaceId?: number | null;
  targetInterfaceName?: string;

  inbound: number;
  outbound: number;

  // Display preference
  swapTraffic?: boolean;

  sourceAdminStatus: number;
  sourceOperStatus: number;
  sourceStatus: string;

  targetAdminStatus: number;
  targetOperStatus: number;
  targetStatus: string;

  aggregatedInterfaces?: AggregatedInterface[];

  edgePosition?: EdgePosition;

  targetLabelOffset?: {
    x: number;
    y: number;
  };

  sourceLabelOffset?: {
    x: number;
    y: number;
  };
}

export type TopologyEdge = Edge<TopologyEdgeData>;
export default function WeatherMapComponent() {
  // Interface and device
  const device = useDevicesStore((state) => state.device);
  const setDevice = useDevicesStore((state) => state.setDevice);
  const interfaces = useInterfacesWeathermap((state) => state.interfaces);
  const setInterfaces = useInterfacesWeathermap((state) => state.setInterfaces);

  // Node
  const [nodeName, setNodeName] = useState<string>("");
  const [nodes, setNodes] = useNodesState<TopologyNode>([]);
  const [nodeType, setNodeType] = useState<string>("");
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
  const [aggregationMode, setAggregationMode] =
    useState<AggregationMode>("automatic");
  const [aggregations, setAggregations] = useState<AggregationGroup[]>([]);
  const updateNodeInternals = useUpdateNodeInternals();
  const [handles, setHandles] = useState<HandleLayout>({
    top: [],
    right: [],
    bottom: [],
    left: [],
  });

  const [edges, setEdges] = useEdgesState<TopologyEdge>([]);
  const edgeReconnectSuccessful = useRef<boolean>(true);

  const [counts, setCounts] = useState<HandleCounts>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });
  //   Edge

  const router = useRouter();
  const hasFetchedInterfacesRef = useRef<boolean>(false);
  const [topologyName, setTopologyName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  // React Flow
  const { screenToFlowPosition } = useReactFlow();
  const [dragItem] = useDnD();

  const onNodesChange = useCallback(
    (changes: NodeChange<TopologyNode>[]) => {
      setNodes((nodes) => applyNodeChanges(changes, nodes) as TopologyNode[]);
    },
    [setNodes],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange<TopologyEdge>[]) => {
      setEdges((edges) => applyEdgeChanges(changes, edges) as TopologyEdge[]);
    },
    [setEdges],
  );
  const findHandle = (
    handles: HandleLayout,
    id: string,
  ): NodeHandle | undefined => {
    return [
      ...handles.top,
      ...handles.right,
      ...handles.bottom,
      ...handles.left,
    ].find((h) => h.id === id);
  };
  const updateHandle = useCallback(
    (
      nodeId: string,
      handleId: string,
      interfaceId: number,
      interfaceName: string,
      nodeName: string,
    ) => {
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id !== nodeId) {
            return node;
          }

          const position = handleId.split("-")[0] as keyof HandleLayout;

          const updatedHandles = {
            ...node.data.handles,

            [position]: node.data.handles[position].map((handle) =>
              handle.id === handleId
                ? {
                    ...handle,
                    interfaceId,
                    interfaceName,
                    nodeName,
                  }
                : handle,
            ),
          };

          return {
            ...node,
            data: {
              ...node.data,
              handles: updatedHandles,
            },
          };
        }),
      );
    },
    [setNodes],
  );
  const updateHandleTraffic = useCallback(
    (nodeId: string, handleId: string, inbound: number, outbound: number) => {
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id !== nodeId) {
            return node;
          }

          const position = handleId.split("-")[0] as keyof HandleLayout;

          const updatedHandles = {
            ...node.data.handles,

            [position]: node.data.handles[position].map((handle) =>
              handle.id === handleId
                ? {
                    ...handle,
                    inbound,
                    outbound,
                  }
                : handle,
            ),
          };

          return {
            ...node,
            data: {
              ...node.data,
              handles: updatedHandles,
            },
          };
        }),
      );
    },
    [setNodes],
  );
  const onConnect = useCallback(
    (params: Connection) => {
      if (
        !params.source ||
        !params.target ||
        !params.sourceHandle ||
        !params.targetHandle
      ) {
        return;
      }
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (!sourceNode || !targetNode) return;

      const sourceHandle = findHandle(
        sourceNode.data.handles,
        params.sourceHandle,
      );

      const targetHandle = findHandle(
        targetNode.data.handles,
        params.targetHandle,
      );

      if (!sourceHandle || !targetHandle) {
        console.warn("Handle not found.");
        return;
      }

      // ---------------------------------------------
      // Determine logical node purpose
      // ---------------------------------------------

      const sourceIsBlank = sourceNode.data.nodeType === "blank";

      const targetIsBlank = targetNode.data.nodeType === "blank";

      // ---------------------------------------------
      // Normal nodes MUST have interfaces
      // Blank nodes don't need interfaces
      // ---------------------------------------------
      if (sourceIsBlank && !targetIsBlank) {
        updateHandle(
          sourceNode.id,
          params.sourceHandle!,
          targetNode.data.interfaceId!,
          targetNode.data.label ?? "",
          targetNode.data.nodeName ?? "Unknown",
        );
      }

      if (!sourceIsBlank && targetIsBlank) {
        updateHandle(
          targetNode.id,
          params.targetHandle!,
          sourceNode.data.interfaceId!,
          sourceNode.data.label ?? "",
          sourceNode.data.nodeName ?? "Unknown",
        );
      }
      if (!sourceIsBlank && sourceNode.data.interfaceId == null) {
        toast.warning("Please assign an interface to the source handle.");
        return;
      }

      if (!targetIsBlank && targetNode.data.interfaceId == null) {
        toast.warning("Please assign an interface to the target handle.");
        return;
      }

      let aggregatedInterfaces: AggregatedInterface[] = [];
      let aggregationId: string | undefined;
      let aggregation: AggregationGroup | undefined;
      let aggregatedInbound = 0;
      let aggregatedOutbound = 0;

      if (
        sourceIsBlank &&
        sourceNode.data.aggregationMode === "manual" &&
        sourceHandle?.aggregationId
      ) {
        aggregationId = sourceHandle.aggregationId;
        aggregation = sourceNode.data.aggregations?.find(
          (agg) => agg.id === sourceHandle.aggregationId,
        );

        if (aggregation) {
          aggregatedInbound = aggregation.interfaces.reduce(
            (total, iface) => total + Number(iface.inbound ?? 0),
            0,
          );

          aggregatedOutbound = aggregation.interfaces.reduce(
            (total, iface) => total + Number(iface.outbound ?? 0),
            0,
          );

          // Update the handle with the aggregation traffic
          updateHandleTraffic(
            sourceNode.id,
            params.sourceHandle,
            aggregatedInbound,
            aggregatedOutbound,
          );
        }
      }

      const shouldAggregate =
        sourceNode.data.aggregationMode === "automatic" &&
        targetNode.data.aggregationMode === "automatic";
      if (shouldAggregate) {
        aggregatedInterfaces = sourceIsBlank
          ? Array.from(
              new Map(
                edges
                  .filter(
                    (existingEdge) => existingEdge.target === sourceNode.id,
                  )
                  .flatMap((existingEdge) => {
                    const existingData = existingEdge.data as TopologyEdgeData;

                    if (existingData.sourceInterfaceId == null) {
                      return [];
                    }

                    return [
                      [
                        existingData.sourceInterfaceId,
                        {
                          interfaceId: existingData.sourceInterfaceId,
                          interfaceName: existingData.sourceInterfaceName ?? "",
                          sourceNodeName: existingData.sourceNodeName ?? "",
                        },
                      ] as const,
                    ];
                  }),
              ).values(),
            )
          : [];
      }

      const edge: TopologyEdge = {
        id: `edge-${Date.now()}-${Math.random()}`,

        source: params.source,
        target: params.target,

        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,

        type: "start-end",

        data: {
          ...(sourceIsBlank
            ? {
                sourceInterfaceName: sourceHandle.interfaceName ?? "Blank Node",
                sourceNodeType: sourceNode.type,
              }
            : {
                sourceInterfaceId: sourceNode.data.interfaceId,
                sourceInterfaceName: sourceHandle.interfaceName ?? "",
                sourceNodeType: sourceNode.type ?? "",
              }),

          ...(targetIsBlank
            ? {
                targetInterfaceName: targetHandle.interfaceName ?? "Blank Node",
                targetNodeType: targetNode.type,
              }
            : {
                targetInterfaceId: targetNode.data.interfaceId,
                targetInterfaceName: targetHandle.interfaceName ?? "",
                targetNodeType: targetNode.type ?? "",
              }),
          sourceNodeName: sourceNode.data.nodeName ?? "Unknown",
          targetNodeName: targetNode.data.nodeName ?? "Unknown",
          bandwidthMbps: 1000,
          status: "up",
          description: "",

          inbound: 0,
          outbound: 0,

          sourceAdminStatus: 0,
          sourceOperStatus: 0,
          sourceStatus: "",

          targetAdminStatus: 0,
          targetOperStatus: 0,
          targetStatus: "",

          swapTraffic: false,

          ...(shouldAggregate ? { aggregatedInterfaces } : {}),
          ...(aggregationId && aggregation
            ? {
                aggregationId,
                aggregationName: aggregation.name,
                aggregatedInterfaces: aggregation.interfaces
                  .filter((iface) => iface.interfaceId != null)
                  .map((iface) => ({
                    interfaceId: iface.interfaceId!,
                    interfaceName: iface.interfaceName,
                    sourceNodeName: iface.nodeName!,
                  })),
              }
            : {}),
        },
      };

      setEdges((eds) => [...eds, edge]);
    },
    [edges, nodes, setEdges, updateHandle, updateHandleTraffic],
  );

  const onReconnect: OnReconnect<TopologyEdge> = useCallback(
    (oldEdge, newConnection) => {
      setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds));
    },
    [setEdges],
  );

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnectEnd = useCallback(
    (_event: MouseEvent | TouchEvent, edge: Edge) => {
      if (!edgeReconnectSuccessful.current) {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      }

      edgeReconnectSuccessful.current = true;
    },
    [setEdges],
  );

  const onNodeDragStop = useCallback<OnNodeDrag<TopologyNode>>(
    (event, node) => {
      console.log(node.data.label);
    },
    [],
  );

  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      setNodes((nds) =>
        nds.filter((n) => !deletedNodes.some((d) => d.id === n.id)),
      );

      setEdges((eds) =>
        eds.filter(
          (e) =>
            !deletedNodes.some((d) => d.id === e.source || d.id === e.target),
        ),
      );
    },
    [setEdges, setNodes],
  );

  const handleNodeSettings = (node: TopologyNode) => {
    setSelectedNode(node);

    setNodeName(
      node.data.nodeName === "" ? node.data.description : node.data.nodeName,
    );
    setNodeType(node.type ?? "");

    setCounts({
      top: node.data.handles.top.length,
      right: node.data.handles.right.length,
      bottom: node.data.handles.bottom.length,
      left: node.data.handles.left.length,
    });

    setAggregationMode(node.data.aggregationMode ?? "automatic");
    setHandles(node.data.handles);
    setAggregations(node.data.aggregations ?? []);
  };
  const onNodeDoubleClick: NodeMouseHandler<TopologyNode> = useCallback(
    (_event, node) => {
      handleNodeSettings(node);
    },
    [],
  );
  const onEdgeClick: EdgeMouseHandler<TopologyEdge> = useCallback(
    (_event, edge) => {
      console.log("Selected Edge:", edge);
    },
    [],
  );
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!dragItem) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      if (dragItem.type === "blank") {
        const newNode: TopologyNode = {
          id: `blank-${Date.now()}`,
          type: nodeType, // or your desired default
          position,
          data: {
            nodeName: dragItem.data.nodeName,
            nodeType: nodeType,
            label: dragItem.data.label,
            ip: dragItem.data.ip,
            description: dragItem.data.description,

            handles: {
              top: [],
              right: [],
              bottom: [],
              left: [],
            },
            // Aggregation configuration
            aggregationMode: "automatic",
            aggregations: [],
          },
        };

        setNodes((nodes) => [...nodes, newNode]);

        return;
      }
      if (dragItem.type === "interface") {
        const iface = dragItem.data;

        const deviceInfo = device.find((d) => d.ipAddress === iface.deviceIp);

        if (!deviceInfo) return;

        const newNode: TopologyNode = {
          id: `${iface.id}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`,
          type: nodeType,
          position,
          data: {
            interfaceId: iface.id,
            deviceId: Number(deviceInfo.id),
            nodeName: "",
            nodeType: nodeType,
            label: iface.name,
            ip: deviceInfo.ipAddress,
            description: iface.description ?? "",
            // vendor: deviceInfo.vendor,
            // model: deviceInfo.model,
            status: deviceInfo.status,
            // interfaces,
            handles: {
              top: [],
              right: [],
              bottom: [],
              left: [],
            },
            // Aggregation configuration
            aggregationMode: "automatic",
            aggregations: [],
          },
        };
        setNodes((nds) => [...nds, newNode]);
        return;
      }

      if (dragItem.type === "device") {
        const dev = dragItem.data;

        const newNode: TopologyNode = {
          id: `${dev.id}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`,
          type: nodeType,
          position,
          data: {
            id: dev.id,
            label: dev.sysName ?? dev.ipAddress,
            ip: dev.ipAddress,
            nodeName: "",
            nodeType: nodeType,

            description: dev.sysDescr ?? "",
            // vendor: dev.vendor,
            // model: dev.model,
            status: dev.status,
            interfaces: [], // populate later if needed
            handles: {
              top: [],
              right: [],
              bottom: [],
              left: [],
            },
            // Aggregation configuration
            aggregationMode: "automatic",
            aggregations: [],
          },
        };

        setNodes((nds) => [...nds, newNode]);
      }
    },
    [dragItem, screenToFlowPosition, device, nodeType, setNodes],
  );
  useEffect(() => {
    const currentDevices = useDevicesStore.getState().device;

    if (currentDevices.length > 0) {
      return;
    }

    const fetchDevice = async () => {
      try {
        const res = await fetch("/api/snmp/device", {
          method: "GET",
        });

        const resData = await res.json();

        if (!res.ok) {
          if (res.status === 401) {
            router.replace("/");
            return;
          }

          toast.error(resData.message);
          return;
        }

        setDevice(resData.data);

        toast.success("Devices loaded successfully!");
      } catch {
        toast.error("Internal Server Error.", {
          description: "Server error please contact admin.",
        });
      }
    };

    fetchDevice();
  }, [router, setDevice]);

  useEffect(() => {
    if (device.length === 0) return;
    if (hasFetchedInterfacesRef.current) return;

    hasFetchedInterfacesRef.current = true;

    const fetchInterfaces = async () => {
      try {
        const results = await Promise.all(
          device.map(async (dev) => {
            const raw = tripleEncode(dev.ipAddress);

            const res = await fetch(`/api/snmp/traffic?id=${raw}`);

            const resData = await res.json();

            if (!res.ok) {
              throw new Error(resData.message || "Failed fetching interface");
            }

            return resData.interfaces.map((iface: InterfaceTypes) => ({
              ...iface,
              deviceIp: dev.ipAddress,
            }));
          }),
        );

        setInterfaces(results.flat());

        toast.success("Interfaces loaded successfully!");
      } catch (error) {
        console.error(error);

        // Allow retry if the request failed
        hasFetchedInterfacesRef.current = false;

        toast.error("Failed loading interfaces");
      }
    };

    fetchInterfaces();
  }, [device, setInterfaces]);

  const saveTopology = useCallback(async () => {
    const name = topologyName.trim();
    const desc = description.trim();
    if (name === "") {
      toast.error("Failed to save topology!", {
        description: "Please make sure you set the topology name.",
      });
      return;
    }
    try {
      const payload = {
        name: name,
        description: desc,

        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type,

          position: {
            x: node.position.x,
            y: node.position.y,
          },

          width: node.measured?.width,
          height: node.measured?.height,

          data: node.data,
        })),

        edges: edges.map((edge) => ({
          id: edge.id,

          source: edge.source,
          target: edge.target,

          sourceHandle: edge.sourceHandle ?? null,

          targetHandle: edge.targetHandle ?? null,

          type: edge.type,

          data: edge.data ?? {},
        })),
      };

      const response = await fetch("/api/topology", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.replace("/weathermap");
      return result;
    } catch (error) {
      console.error("SAVE TOPOLOGY ERROR:", error);
    }
  }, [topologyName, description, nodes, edges, router]);

  return (
    <div className="space-y-5">
      <div className="flex flex-row items-center gap-3">
        <Input
          value={topologyName}
          onChange={(e) => setTopologyName(e.target.value)}
          placeholder="Topology name..."
          className="w-100 rounded-sm"
        />
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description..."
          className="w-100 rounded-sm"
        />
        <Button
          className="cursor-pointer"
          onClick={async () => {
            await saveTopology();
          }}
        >
          Save Topology
        </Button>
      </div>
      <div className="flex flex-row items-start gap-2">
        <div className="w-full h-174 border">
          <ReactFlow<TopologyNode, TopologyEdge>
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onNodesChange={onNodesChange}
            onNodeDragStop={onNodeDragStop}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onReconnect={onReconnect}
            onReconnectStart={onReconnectStart}
            onReconnectEnd={onReconnectEnd}
            onNodesDelete={onNodesDelete}
            onNodeDoubleClick={onNodeDoubleClick}
            onEdgeClick={onEdgeClick}
            fitView
            colorMode="system"
          >
            <Background />
            <MiniMap />
          </ReactFlow>
          <NodeHandleSettings
            open={!!selectedNode}
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            nodeType={nodeType}
            counts={counts}
            nodeName={nodeName}
            setNodeType={setNodeType}
            setNodeName={setNodeName}
            setCounts={setCounts}
            handles={handles}
            aggregationMode={aggregationMode}
            aggregations={aggregations}
            setHandles={setHandles}
            setAggregationMode={setAggregationMode}
            setAggregations={setAggregations}
            onSave={({ type, handles, aggregationMode, aggregations }) => {
              if (!selectedNode) return;

              setNodes((nds) =>
                nds.map((n) =>
                  n.id === selectedNode.id
                    ? {
                        ...n,
                        type,
                        data: {
                          ...n.data,

                          nodeName,
                          nodeType: type,

                          handles,

                          // ADD THESE
                          aggregationMode,
                          aggregations,
                        },
                      }
                    : n,
                ),
              );

              setNodeType("");

              setCounts({
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
              });

              requestAnimationFrame(() => {
                updateNodeInternals(selectedNode.id);
              });

              setSelectedNode(null);
            }}
          />
        </div>
        <SidebarWeathermap interfaces={interfaces} devices={device} />
      </div>
    </div>
  );
}
