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
  OnNodeDrag,
  useReactFlow,
  applyNodeChanges,
  NodeChange,
  EdgeChange,
  applyEdgeChanges,
  EdgeMouseHandler,
  EdgeLabelRenderer,
} from "@xyflow/react";
import { useUpdateNodeInternals } from "@xyflow/react";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDevicesStore, useInterfacesWeathermap } from "@/store/device-store";
import { toast } from "sonner";
import { InterfaceTypes } from "@/lib/types";
import { tripleDecode, tripleEncode } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import TestRouterNode from "@/components/TestRouterNode";
import SwitchNode from "@/components/weathermap/nodes/SwitchNode";
import CloudNode from "@/components/weathermap/nodes/CloudNode";
import {
  AggregationGroup,
  AggregationMode,
  useDnD,
} from "@/components/DnDContext";
import NodeHandleSettings from "@/components/NodeHandleSettings";
import EdgeSettings from "@/components/EdgeSettings";
import { Button } from "@/components/ui/button";
import SidebarWeathermap from "@/components/SidebarWeathermap";
import ServerNode from "@/components/weathermap/nodes/ServerNode";
import {
  edgeTypes,
  HandleCounts,
  HandleLayout,
  NodeHandle,
  TopologyEdge,
  TopologyEdgeData,
  TopologyNode,
  TopologyNodeData,
} from "@/components/WeatherMapComponent";
import EdgeTrafficPanel from "@/components/weathermap/EdgeTrafficPanel";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Input } from "@/components/ui/input";
const nodeTypes = {
  router: TestRouterNode,
  switch: SwitchNode,
  cloud: CloudNode,
  server: ServerNode,
  blank: CloudNode,
};

export interface AggregatedInterface {
  interfaceId: number;
  interfaceName: string;
  sourceNodeName: string;
}
export default function ViewWeathermapSettings() {
  // Interface and device
  const { interfaces, setInterfaces } = useInterfacesWeathermap();
  const { device, setDevice } = useDevicesStore();

  // Node
  const [nodes, setNodes] = useNodesState<TopologyNode>([]);
  const [nodeName, setNodeName] = useState<string>("");
  const [nodeType, setNodeType] = useState<string>("");
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
  const [handles, setHandles] = useState<HandleLayout>({
    top: [],
    right: [],
    bottom: [],
    left: [],
  });
  const [topologyName, setTopologyName] = useState<string>("");
  const [topoDescription, setTopoDescription] = useState<string>("");

  const [aggregationMode, setAggregationMode] =
    useState<AggregationMode>("automatic");
  const [aggregations, setAggregations] = useState<AggregationGroup[]>([]);
  const updateNodeInternals = useUpdateNodeInternals();

  //   Edge
  const [edges, setEdges] = useEdgesState<TopologyEdge>([]);
  const edgeReconnectSuccessful = useRef<boolean>(true);
  const [swapTraffic, setSwapTraffic] = useState<boolean>(false);
  const [selectedEdge, setSelectedEdge] = useState<TopologyEdge | null>(null);

  const router = useRouter();
  const hasMountedRef = useRef<boolean>(false);
  const hasFetchedInterfacesRef = useRef<boolean>(false);
  const [counts, setCounts] = useState<HandleCounts>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  // React Flow
  const { screenToFlowPosition } = useReactFlow();
  const [dragItem] = useDnD();

  const onNodesChange = useCallback(
    (changes: NodeChange<TopologyNode>[]) => {
      setNodes((nodes) => applyNodeChanges(changes, nodes));
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

          sourceLabelOffset: {
            x: 0,
            y: 0,
          },

          targetLabelOffset: {
            x: 0,
            y: 0,
          },

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
  const edgeClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [trafficEdgeId, setTrafficEdgeId] = useState<string | null>(null);
  const trafficEdge = useMemo(() => {
    if (!trafficEdgeId) return null;

    return edges.find((edge) => edge.id === trafficEdgeId) ?? null;
  }, [edges, trafficEdgeId]);
  const trafficEdgePosition = useMemo(() => {
    if (!trafficEdge) return null;

    const sourceNode = nodes.find((node) => node.id === trafficEdge.source);

    const targetNode = nodes.find((node) => node.id === trafficEdge.target);

    if (!sourceNode || !targetNode) return null;

    const sourceWidth = sourceNode.measured?.width ?? sourceNode.width ?? 0;
    const sourceHeight = sourceNode.measured?.height ?? sourceNode.height ?? 0;

    const targetWidth = targetNode.measured?.width ?? targetNode.width ?? 0;
    const targetHeight = targetNode.measured?.height ?? targetNode.height ?? 0;

    const sourceX = sourceNode.position.x + sourceWidth / 2;
    const sourceY = sourceNode.position.y + sourceHeight / 2;

    const targetX = targetNode.position.x + targetWidth / 2;
    const targetY = targetNode.position.y + targetHeight / 2;

    return {
      x: (sourceX + targetX) / 2,
      y: (sourceY + targetY) / 2,
    };
  }, [trafficEdge, nodes]);
  const [edgeSettingsOpen, setEdgeSettingsOpen] = useState<boolean>(false);

  const onEdgeContextMenu: EdgeMouseHandler<TopologyEdge> = useCallback(
    (event, edge) => {
      event.preventDefault();

      const topologyEdge = edge as TopologyEdge;

      setTrafficEdgeId(topologyEdge.id);
    },
    [],
  );
  const onEdgeDoubleClick: EdgeMouseHandler<TopologyEdge> = useCallback(
    (_event, edge) => {
      const topologyEdge = edge as TopologyEdge;
      if (edgeClickTimer.current) {
        clearTimeout(edgeClickTimer.current);
        edgeClickTimer.current = null;
      }

      setTrafficEdgeId(null);

      setSelectedEdge(topologyEdge);

      setSwapTraffic(topologyEdge.data?.swapTraffic ?? false);

      setEdgeSettingsOpen(true);
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
          id: `blank-${Date.now()}-${Math.random()}`,
          type: nodeType,
          position,
          data: {
            nodeName: dragItem.data.nodeName,
            label: dragItem.data.label,
            ip: dragItem.data.ip,
            description: dragItem.data.description,
            nodeType,

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
          id: `${iface.id}-${Date.now()}-${Math.random()}`,
          type: nodeType,
          position,
          data: {
            interfaceId: iface.id,
            deviceId: Number(deviceInfo.id),
            nodeName: "",
            label: iface.name,
            ip: deviceInfo.ipAddress,
            nodeType,
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
          id: `${dev.id}-${Date.now()}-${Math.random()}`,
          type: nodeType,
          position,
          data: {
            id: dev.id,
            label: dev.sysName ?? dev.ipAddress,
            ip: dev.ipAddress,
            nodeName: "",
            description: dev.sysDescr ?? "",
            // vendor: dev.vendor,
            nodeType,
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
  const sourceInterface = useMemo(() => {
    if (!trafficEdge) return undefined;

    const interfaceId = trafficEdge.data?.sourceInterfaceId;

    if (typeof interfaceId !== "number") {
      return undefined;
    }

    return interfaces.find((iface) => iface.id === interfaceId);
  }, [trafficEdge, interfaces]);

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
    if (interfaces.length > 0) {
      setInterfaces(interfaces);
      return;
    }
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
  }, [device, interfaces, setInterfaces]);
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

  //   Load topology ____________________________________
  const loadTopology = useCallback(
    async (topologyId: string) => {
      try {
        const response = await fetch(`/api/topology/${topologyId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message ?? "Failed to load topology");
        }

        // ---------------------------------------------
        // LOAD NODES
        // ---------------------------------------------

        const loadedNodes: TopologyNode[] = result.data.nodes.map(
          (node: {
            id: string;
            type: string;
            position: {
              x: number;
              y: number;
            };
            width?: number | null;
            height?: number | null;
            data: TopologyNodeData;
          }) => ({
            id: node.id,
            type: node.type,
            position: node.position,

            ...(node.width != null
              ? {
                  width: node.width,
                }
              : {}),

            ...(node.height != null
              ? {
                  height: node.height,
                }
              : {}),

            data: {
              ...node.data,

              // -----------------------------------------
              // Aggregation settings
              // -----------------------------------------

              aggregationMode: node.data.aggregationMode ?? "automatic",

              aggregations: node.data.aggregations ?? [],

              // -----------------------------------------
              // Handle settings
              // -----------------------------------------

              handles: {
                top: node.data.handles?.top ?? [],
                right: node.data.handles?.right ?? [],
                bottom: node.data.handles?.bottom ?? [],
                left: node.data.handles?.left ?? [],
              },
            },
          }),
        );

        // ---------------------------------------------
        // LOAD EDGES
        // ---------------------------------------------

        const loadedEdges: TopologyEdge[] = result.data.edges.map(
          (edge: {
            id: string;
            source: string;
            target: string;
            sourceHandle?: string | null;
            targetHandle?: string | null;
            type?: string;
            data: TopologyEdgeData;
          }) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,

            sourceHandle: edge.sourceHandle ?? undefined,
            targetHandle: edge.targetHandle ?? undefined,

            type: edge.type ?? "start-end",

            data: {
              ...edge.data,

              aggregatedInterfaces: edge.data.aggregatedInterfaces ?? [],
            },
          }),
        );

        // ---------------------------------------------
        // UPDATE REACT FLOW
        // ---------------------------------------------
        setTopologyName(result.data.name);
        setTopoDescription(result.data.description);
        setNodes(loadedNodes);
        setEdges(loadedEdges);

        return result.data;
      } catch (error) {
        console.error("LOAD TOPOLOGY ERROR:", error);
      }
    },
    [setNodes, setEdges],
  );

  const params = useParams();
  const raw = decodeURIComponent(params.id as string);
  const topologyId = tripleDecode(raw);
  const updateTopology = useCallback(async () => {
    if (topologyId === null) {
      console.error("No topology ID");
      return;
    }
    const name = topologyName.trim();
    const description = topoDescription.trim();
    try {
      const payload = {
        name: name,
        description: description,

        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type,

          position: {
            x: node.position.x,
            y: node.position.y,
          },

          width: node.measured?.width ?? node.width ?? 0,
          height: node.measured?.height ?? node.height ?? 0,

          data: node.data,
        })),

        edges: edges.map((edge) => ({
          id: edge.id,

          source: edge.source,
          target: edge.target,

          sourceHandle: edge.sourceHandle ?? null,
          targetHandle: edge.targetHandle ?? null,

          type: edge.type ?? null,

          data: edge.data ?? {},
        })),
      };

      const response = await fetch(`/api/topology/${topologyId}`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      const result = await response.json();

      toast.success(result.message);
      if (!response.ok) {
        throw new Error(result.message ?? "Failed to update topology");
      }

      return result;
    } catch (error) {
      console.error("UPDATE TOPOLOGY ERROR:", error);
    }
  }, [topologyId, topologyName, topoDescription, nodes, edges]);
  const hasLoadedRef = useRef<boolean>(false);
  useEffect(() => {
    if (topologyId === null) return;
    if (hasLoadedRef.current) return;

    loadTopology(topologyId);
    hasLoadedRef.current = false;
  }, [topologyId, loadTopology]);
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            {
              label: "Dashboard",
              href: "/dashboard",
            },
            {
              label: "Weathermap",
              href: "/weathermap",
            },
            {
              label: "Weathermap Settings",
            },
          ]}
        />
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-lg font-bold">Weathermap</h1>
        </div>
      </div>
      <div className="flex flex-row items-center gap-3">
        <Input
          value={topologyName}
          onChange={(e) => setTopologyName(e.target.value)}
          placeholder="Topology name..."
          className="w-100 rounded-sm"
        />
        <Input
          value={topoDescription}
          onChange={(e) => setTopoDescription(e.target.value)}
          placeholder="Description..."
          className="w-100 rounded-sm"
        />
        <Button
          onClick={async () => {
            await updateTopology();
          }}
        >
          Update Topology
        </Button>
      </div>
      <div className="flex flex-row gap-2">
        <div className="w-full h-174 flex flex-col items-start justify-center border rounded-md overflow-hidden">
          <div className="w-full h-full">
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
              onEdgeContextMenu={onEdgeContextMenu}
              onEdgeDoubleClick={onEdgeDoubleClick}
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
            <EdgeSettings
              open={edgeSettingsOpen}
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
                      data: {
                        ...edge.data,
                        ...data,
                      },
                    };
                  }),
                );

                setSelectedEdge(null);
              }}
            />
            {trafficEdge && trafficEdgePosition && (
              <EdgeLabelRenderer>
                <div
                  style={{
                    position: "absolute",
                    transform: `
          translate(-50%, -100%)
          translate(
            ${trafficEdgePosition.x}px,
            ${trafficEdgePosition.y}px
          )
        `,
                    pointerEvents: "all",
                    zIndex: 1000,
                  }}
                >
                  <EdgeTrafficPanel
                    sourceInterface={sourceInterface}
                    interfaces={interfaces}
                    sourceNodeName={trafficEdge.data?.sourceNodeName ?? ""}
                    targetNodeName={trafficEdge.data?.targetNodeName ?? ""}
                    sourceInterfaceName={
                      trafficEdge.data?.sourceInterfaceName ?? ""
                    }
                    targetInterfaceName={
                      trafficEdge.data?.targetInterfaceName ?? ""
                    }
                    aggregatedInterfaces={
                      trafficEdge.data?.aggregatedInterfaces ?? []
                    }
                    inbound={trafficEdge.data?.inbound ?? 0}
                    outbound={trafficEdge.data?.outbound ?? 0}
                    onClose={() => setTrafficEdgeId(null)}
                  />
                </div>
              </EdgeLabelRenderer>
            )}
          </div>
        </div>

        <SidebarWeathermap interfaces={interfaces} devices={device} />
      </div>
    </div>
  );
}
