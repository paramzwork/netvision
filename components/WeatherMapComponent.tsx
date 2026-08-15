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
import TestRouterNode from "./TestRouterNode";
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
const nodeTypes = {
  router: TestRouterNode,
  switch: SwitchNode,
  cloud: CloudNode,
  server: ServerNode,
  blank: CloudNode,
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
export interface NodeHandle {
  id: string;
  interfaceId?: number;
  interfaceName: string;
  nodeName?: string;

  aggregationId?: string;
  // Traffic represented by this handle
  inbound?: number;
  outbound?: number;
  type: "source" | "target";
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
}

export type TopologyEdge = Edge<TopologyEdgeData>;
export default function WeatherMapComponent() {
  // Interface and device
  const { interfaces, setInterfaces } = useInterfacesWeathermap();
  const { device, setDevice } = useDevicesStore();

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
  const hasMountedRef = useRef<boolean>(false);
  const hasFetchedInterfacesRef = useRef<boolean>(false);
  const [topologyName, setTopologyName] = useState<string>("");
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
      console.log("PARAMS", params);
      console.log(sourceHandle);
      console.log(targetHandle);

      if (
        sourceNode.data.nodeType !== "blank" &&
        sourceHandle.interfaceId == null
      ) {
        toast.warning("Please assign an interface to the source handle.");
        return;
      }
      if (
        targetNode.data.nodeType !== "blank" &&
        targetHandle.interfaceId == null
      ) {
        toast.warning("Please assign an interface to the target handle.");
        return;
      }
      const edge: TopologyEdge = {
        id: `${params.source}-${params.sourceHandle}-${params.target}-${params.targetHandle}`,

        source: params.source,
        target: params.target,

        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        type: "start-end",
        data: {
          sourceInterfaceId: sourceHandle.interfaceId,
          sourceInterfaceName: sourceHandle.interfaceName,
          nodeName: "",

          targetInterfaceId: targetHandle.interfaceId,
          targetInterfaceName: targetHandle.interfaceName,

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

          trafficHistory: [],
        },
      };

      setEdges((eds) => [...eds, edge]);
    },
    [nodes, setEdges],
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

  const onNodeDoubleClick: NodeMouseHandler<TopologyNode> = useCallback(
    (_event, node) => {
      console.log("Selected Node: ", node);
      setSelectedNode(node);
      setNodeType(node.type || "");
      setCounts({
        top: node.data.handles?.top.length || 0,
        right: node.data.handles?.right.length || 0,
        bottom: node.data.handles?.bottom.length || 0,
        left: node.data.handles?.left.length || 0,
      });
      setNodeName(
        node.data.nodeName === "" ? node.data.description : node.data.nodeName,
      );
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
        console.log(newNode);
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

  const fetchDevice = useCallback(async () => {
    if (device.length > 0) {
      setDevice(device);
      return;
    }
    try {
      // const raw = tripleEncode("all");
      const res = await fetch(`/api/snmp/device`, { method: "GET" });
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
  }, [device, router, setDevice]);

  const fetchInterfaces = useCallback(async () => {
    if (device.length === 0) return;

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

      const allInterfaces = results.flat();
      setInterfaces(allInterfaces);

      toast.success("Interfaces loaded successfully!");
    } catch (error) {
      console.error(error);

      toast.error("Failed loading interfaces");
    }
  }, [device, setInterfaces]);
  useEffect(() => {
    if (hasMountedRef.current) return;
    fetchDevice();
    hasMountedRef.current = true;
  }, [fetchDevice]);

  useEffect(() => {
    if (device.length === 0) return;
    if (hasFetchedInterfacesRef.current) return;

    fetchInterfaces();
    hasFetchedInterfacesRef.current = true;
  }, [device, fetchInterfaces]);

  const saveTopology = useCallback(async () => {
    const name = topologyName.trim();
    if (name === "") {
      toast.error("Failed to save topology!", {
        description: "Please make sure you set the topology name.",
      });
      return;
    }
    try {
      const payload = {
        name: "My Network Topology",
        description: "NetVision weather map",

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

      console.log("SAVING TOPOLOGY:", payload);

      const response = await fetch("/api/topology", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message ?? "Failed to save topology");
      }

      console.log("TOPOLOGY SAVED:", result);

      return result;
    } catch (error) {
      console.error("SAVE TOPOLOGY ERROR:", error);
    }
  }, [topologyName, nodes, edges]);

  return (
    <div className="space-y-5">
      <Input
        value={topologyName}
        onChange={(e) => setTopologyName(e.target.value)}
        placeholder="Topology name..."
        className="w-100 rounded-sm"
      />
      <div className="flex flex-row">
        <div className="w-full h-170 border">
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
            onSave={({ type, handles }) => {
              console.log("Saving handles", handles);

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
                          handles,
                        },
                      }
                    : n,
                ),
              );
              setNodeType("");
              setCounts({ top: 0, right: 0, bottom: 0, left: 0 });
              requestAnimationFrame(() => {
                updateNodeInternals(selectedNode.id);
              });
              setSelectedNode(null);
            }}
          />
          {/* <EdgeSettings
            open={!!selectedEdge}
            edge={selectedEdge}
            swapTraffic={swapTraffic}
            setSwapTraffic={setSwapTraffic}
            onClose={() => setSelectedEdge(null)}
            onSave={(data) => {
              if (!selectedEdge) return;

              setEdges((currentEdges) =>
                currentEdges.map((edge): TopologyEdge => {
                  if (edge.id !== selectedEdge.id) {
                    return edge;
                  }

                  return {
                    ...edge,

                    // IMPORTANT: preserve source, target, handles, type, etc.
                    source: edge.source,
                    target: edge.target,
                    sourceHandle: edge.sourceHandle,
                    targetHandle: edge.targetHandle,
                    type: edge.type,

                    data: {
                      ...edge.data,
                      ...data,
                    },
                  };
                }),
              );

              setSelectedEdge(null);
            }}
          /> */}
          <Button
            onClick={async () => {
              await saveTopology();
            }}
          >
            Save Topology
          </Button>
        </div>
        <SidebarWeathermap interfaces={interfaces} devices={device} />
      </div>
    </div>
  );
}
