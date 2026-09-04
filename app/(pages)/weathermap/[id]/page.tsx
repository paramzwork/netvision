"use client";
import Breadcrumbs from "@/components/Breadcrumbs";
import ViewCloudNode from "@/components/weathermap/view/ViewCloudNode";
import ViewRouterNode from "@/components/weathermap/view/ViewRouterNode";
import ViewSwitchNode from "@/components/weathermap/view/ViewSwitchNode";
import { tripleDecode, tripleEncode } from "@/lib/utils";
import {
  EdgeLabelRenderer,
  EdgeMouseHandler,
  EdgeTypes,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { Maximize2, Minimize2, Settings } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  TopologyEdge,
  TopologyEdgeData,
  TopologyNode,
  TopologyNodeData,
  TrafficHistoryPoint,
} from "@/components/WeatherMapComponent";
import ViewServerNode from "@/components/weathermap/view/ViewServerNode";
import EdgeTrafficPanel from "@/components/weathermap/EdgeTrafficPanel";
import { useDevicesStore, useInterfacesWeathermap } from "@/store/device-store";
import { toast } from "sonner";
import { InterfaceTypes } from "@/lib/types";
import ViewEdgeStartEnd from "@/components/ViewEdgeStartEnd";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/DataContext";

const nodeTypes = {
  router: ViewRouterNode,
  switch: ViewSwitchNode,
  cloud: ViewCloudNode,
  server: ViewServerNode,
  blank: ViewCloudNode,
  blank1: ViewRouterNode,
  blank2: ViewServerNode,
};
export const edgeTypes: EdgeTypes = {
  "start-end": ViewEdgeStartEnd,
};
export default function ViewWeathermap() {
  const { currentUser } = useData();

  const params = useParams();
  const raw = decodeURIComponent(params.id as string);
  const topologyId = tripleDecode(raw);
  const { interfaces, setInterfaces } = useInterfacesWeathermap();
  const { device, setDevice } = useDevicesStore();

  const [nodes, setNodes] = useNodesState<TopologyNode>([]);
  const [edges, setEdges] = useEdgesState<TopologyEdge>([]);

  const router = useRouter();
  const hasMountedRef = useRef<boolean>(false);
  const hasFetchedInterfacesRef = useRef<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [trafficEdgeId, setTrafficEdgeId] = useState<string | null>(null);
  const [trafficPanelOffset, setTrafficPanelOffset] = useState({
    x: 0,
    y: 0,
  });

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

  const onEdgeContextMenu: EdgeMouseHandler<TopologyEdge> = useCallback(
    (event, edge) => {
      event.preventDefault();

      const topologyEdge = edge as TopologyEdge;

      setTrafficPanelOffset({
        x: 0,
        y: 0,
      });

      setTrafficEdgeId(topologyEdge.id);
    },
    [],
  );
  const sourceInterface = useMemo(() => {
    if (!trafficEdge) return undefined;

    const interfaceId = trafficEdge.data?.sourceInterfaceId;

    if (typeof interfaceId !== "number") {
      return undefined;
    }

    return interfaces.find((iface) => iface.id === interfaceId);
  }, [trafficEdge, interfaces]);

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
          if (response.status === 401) {
            router.replace("/");
            return;
          }
          toast.error(result.message);
          return;
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

        setNodes(loadedNodes);
        setEdges(loadedEdges);

        return result.data;
      } catch (error) {
        console.error("LOAD TOPOLOGY ERROR:", error);
      }
    },
    [setNodes, setEdges, router],
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
            if (res.status === 401) {
              router.replace("/");
              return;
            }
            toast.error(resData.message);
            return;
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
  }, [device, interfaces, router, setInterfaces]);
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
  useEffect(() => {
    if (topologyId === null) return;
    loadTopology(topologyId);
  }, [topologyId, loadTopology]);
  useEffect(() => {
    if (topologyId === null) return;

    let cancelled = false;

    const updateTraffic = async () => {
      try {
        const res = await fetch(`/api/topology/${topologyId}/traffic`, {
          cache: "no-store",
        });

        const result = await res.json();
        if (!res.ok) {
          if (res.status === 401) {
            router.replace("/");
            return;
          }
          toast.error(result.message);
          return;
        }

        if (cancelled) return;

        setEdges((currentEdges) =>
          currentEdges.map((edge): TopologyEdge => {
            const traffic = result.data?.[edge.id];

            if (!traffic) {
              return edge;
            }
            const history = Array.isArray(edge.data?.trafficHistory)
              ? edge.data.trafficHistory
              : [];

            const newHistory: TrafficHistoryPoint[] = [
              ...history,
              {
                inbound: Number(traffic.inbound ?? 0),
                outbound: Number(traffic.outbound ?? 0),
                timestamp: Date.now(),
              },
            ].slice(-60);

            return {
              ...edge,

              data: {
                // ----------------------------------------
                // Preserve ALL existing edge data
                // ----------------------------------------
                ...edge.data,

                // ----------------------------------------
                // Traffic
                // ----------------------------------------
                inbound: Number(traffic.inbound ?? 0),
                outbound: Number(traffic.outbound ?? 0),

                sourceDesc: edge.data?.sourceDesc ?? "",
                targetDesc: edge.data?.targetDesc ?? "",

                // ----------------------------------------
                // Traffic history
                // ----------------------------------------
                trafficHistory: newHistory,

                // ----------------------------------------
                // Source status
                // ----------------------------------------
                sourceAdminStatus: Number(
                  traffic.sourceAdminStatus ??
                    edge.data?.sourceAdminStatus ??
                    0,
                ),

                sourceOperStatus: Number(
                  traffic.sourceOperStatus ?? edge.data?.sourceOperStatus ?? 0,
                ),

                sourceStatus:
                  traffic.sourceStatus ?? edge.data?.sourceStatus ?? "",

                // ----------------------------------------
                // Target status
                // ----------------------------------------
                targetAdminStatus: Number(
                  traffic.targetAdminStatus ??
                    edge.data?.targetAdminStatus ??
                    0,
                ),

                targetOperStatus: Number(
                  traffic.targetOperStatus ?? edge.data?.targetOperStatus ?? 0,
                ),

                targetStatus:
                  traffic.targetStatus ?? edge.data?.targetStatus ?? "",
              },
            };
          }),
        );
      } catch (error) {
        console.error("TRAFFIC UPDATE ERROR:", error);
      }
    };

    updateTraffic();

    const interval = setInterval(updateTraffic, 10 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [topologyId, setEdges, router]);

  const handleTrafficPanelMouseDown = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const startMouseX = event.clientX;
    const startMouseY = event.clientY;

    const startOffsetX = trafficPanelOffset.x;
    const startOffsetY = trafficPanelOffset.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startMouseX;
      const dy = moveEvent.clientY - startMouseY;

      setTrafficPanelOffset({
        x: startOffsetX + dx,
        y: startOffsetY + dy,
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // F = fullscreen
      if (
        event.key.toLowerCase() === "f" &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey
      ) {
        // Don't trigger while typing in an input
        const target = event.target as HTMLElement;

        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }

        event.preventDefault();
        setIsFullscreen(true);
      }

      // Escape = exit fullscreen
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  return (
    <div className="w-full h-full flex flex-col gap-5">
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            {
              label: "Dashboard",
              href: "/dashboard",
            },
            {
              label: "Weathermaps",
              href: "/weathermap",
            },
            {
              label: "Weathermap",
            },
          ]}
        />
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-lg font-bold">Weathermap</h1>
          {(currentUser.roles.role.toLowerCase() === "admin" ||
            currentUser.roles.role.toLowerCase() === "super admin") && (
            <Link href={`/settings/weathermap/${raw}`}>
              <Settings className="shrink-0 w-5 h-5" />
            </Link>
          )}
        </div>
      </div>
      <motion.div
        layout
        transition={{
          layout: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
          },
        }}
        className={
          isFullscreen
            ? "fixed inset-0 z-9999 bg-white overflow-hidden"
            : "relative w-full flex-1 min-h-0 border rounded-md overflow-hidden bg-white"
        }
      >
        <ReactFlow<TopologyNode, TopologyEdge>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onEdgeContextMenu={onEdgeContextMenu}
          fitView
          colorMode="system"
        >
          <MiniMap />
          <div className="absolute top-3 right-3 z-50">
            <Button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="flex items-center justify-center w-7 h-7 rounded-md border bg-background/90 hover:bg-background shadow-sm cursor-pointer"
              title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen (F)"}
            >
              {isFullscreen ? (
                <Minimize2 className="shrink-0 text-black w-4 h-4" />
              ) : (
                <Maximize2 className="shrink-0 text-black w-4 h-4" />
              )}
            </Button>
          </div>
          <div className="absolute top-3 left-3 z-50">
            <div className="rounded-md border bg-background/95 p-2 shadow-md backdrop-blur-sm">
              <div className="mb-1 text-[10px] font-semibold">Traffic Load</div>

              <div className="space-y-0.5">
                {[
                  { color: "#ff0000", label: "0–0%" },
                  { color: "#bdbdbd", label: "0–1%" },
                  { color: "#f3f4f6", label: "1–10%" },
                  { color: "#8b00ff", label: "10–25%" },
                  { color: "#2020ff", label: "25–40%" },
                  { color: "#00bfff", label: "40–55%" },
                  { color: "#ffff00", label: "55–70%" },
                  { color: "#ffa500", label: "70–85%" },
                  { color: "#00e600", label: "85–100%" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span
                      className="h-3 w-6 rounded-sm border"
                      style={{
                        backgroundColor: item.color,
                      }}
                    />

                    <span className="text-[8px]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ReactFlow>
      </motion.div>
      {trafficEdge && trafficEdgePosition && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `
          translate(-50%, -10%)
          translate(
            ${trafficEdgePosition.x + trafficPanelOffset.x}px,
            ${trafficEdgePosition.y + trafficPanelOffset.y}px
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
              aggregatedInterfaces={
                trafficEdge.data?.aggregatedInterfaces ?? []
              }
              inbound={trafficEdge.data?.inbound ?? 0}
              outbound={trafficEdge.data?.outbound ?? 0}
              sourceDesc={trafficEdge.data?.sourceDesc ?? ""}
              targetDesc={trafficEdge.data?.targetDesc ?? ""}
              onClose={() => setTrafficEdgeId(null)}
              onDragStart={handleTrafficPanelMouseDown}
            />
          </div>
        </EdgeLabelRenderer>
      )}
    </div>
  );
}
