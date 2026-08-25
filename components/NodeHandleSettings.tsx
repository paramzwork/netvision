"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  HandleCounts,
  HandleLayout,
  HandleType,
  NodeHandle,
  TopologyNode,
} from "./WeatherMapComponent";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import Image from "next/image";
import { Switch } from "./ui/switch";
import { AggregationGroup, AggregationMode } from "./DnDContext";
import { Trash2 } from "lucide-react";
import { useEffect } from "react";

interface NodeHandleSettingsProps {
  open: boolean;
  node: TopologyNode | null;
  onClose: () => void;
  nodeType: string;
  nodeName: string;
  counts: HandleCounts;

  setCounts: React.Dispatch<React.SetStateAction<HandleCounts>>;
  setNodeType: React.Dispatch<React.SetStateAction<string>>;
  setNodeName: React.Dispatch<React.SetStateAction<string>>;

  handles: HandleLayout;
  aggregationMode: AggregationMode;
  aggregations: AggregationGroup[];
  setHandles: React.Dispatch<React.SetStateAction<HandleLayout>>;
  setAggregationMode: React.Dispatch<React.SetStateAction<AggregationMode>>;
  setAggregations: React.Dispatch<React.SetStateAction<AggregationGroup[]>>;

  onSave: (settings: {
    nodeName: string;
    type: string;
    handles: HandleLayout;
    aggregationMode: AggregationMode;
    aggregations: AggregationGroup[];
  }) => void;
}
const nodeTypeList = [
  {
    value: "router",
    image: "/images/router.png",
  },
  { value: "switch", image: "/images/switch.png" },
  { value: "cloud", image: "/images/cloud.png" },
  { value: "server", image: "/images/server.png" },
  { value: "blank", image: "/images/cloud.png" },
  { value: "blank1", image: "/images/router.png" },
];
export default function NodeHandleSettings({
  open,
  node,
  onClose,
  nodeType,
  counts,
  nodeName,

  handles,
  aggregationMode,
  aggregations,
  setHandles,
  setAggregationMode,
  setAggregations,

  setCounts,
  setNodeType,
  setNodeName,
  onSave,
}: NodeHandleSettingsProps) {
  const build = (
    prefix: string,
    count: number,
    existing: NodeHandle[] = [],
  ): NodeHandle[] => {
    return Array.from({ length: count }, (_, i) => {
      const existingHandle = existing[i];

      return {
        id: existingHandle?.id ?? `${prefix}-${i}`,

        interfaceId: existingHandle?.interfaceId,

        interfaceName: existingHandle?.interfaceName ?? "",

        nodeName: existingHandle?.nodeName,

        aggregationId: existingHandle?.aggregationId,

        type: existingHandle?.type ?? "source",

        // Traffic
        inbound: existingHandle?.inbound ?? 0,

        outbound: existingHandle?.outbound ?? 0,
      };
    });
  };
  const assignAggregationToHandle = (
    position: keyof HandleLayout,
    handleId: string,
    aggregationId?: string,
  ) => {
    console.log("position", position);
    console.log("position", handleId);
    console.log("position", aggregationId);
    setHandles((current) => ({
      ...current,

      [position]: current[position].map((handle) =>
        handle.id === handleId
          ? {
              ...handle,
              aggregationId:
                aggregationId === "none" ? undefined : aggregationId,
            }
          : handle,
      ),
    }));
  };
  const handleClose = () => {
    setNodeType("");
    setNodeName("");

    setCounts({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });

    setAggregationMode("automatic");
    setAggregations([]);

    onClose();
  };
  useEffect(() => {
    setHandles((current) => {
      const updated: HandleLayout = {
        top: [],
        right: [],
        bottom: [],
        left: [],
      };

      const positions = ["top", "right", "bottom", "left"] as const;

      for (const position of positions) {
        const existingHandles = current[position] ?? [];

        updated[position] = Array.from(
          { length: counts[position] },
          (_, index) => {
            const handleId = `${position}-${index}`;

            const existingHandle = existingHandles.find(
              (handle) => handle.id === handleId,
            );

            if (existingHandle) {
              return existingHandle;
            }

            return {
              id: handleId,
              interfaceName: "",
              type: "source" as HandleType,
            };
          },
        );
      }

      return updated;
    });
  }, [counts, setHandles]);
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="min-w-150 max-h-125 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Node Settings</DialogTitle>
        </DialogHeader>
        <Label>Name</Label>

        <Input
          value={nodeName}
          placeholder="Enter node name"
          onChange={(e) => setNodeName(e.target.value)}
        />
        <Select
          value={nodeType}
          onValueChange={(v) => setNodeType(v as string)}
        >
          <SelectTrigger
            className="h-9! w-full! text-sm"
            aria-label="Select a preset time range"
          >
            <SelectValue placeholder="Select device">
              <div className="flex items-center gap-2">
                <Image
                  src={`/images/${nodeType === "blank" ? "cloud" : nodeType === "blank1" ? "router" : nodeType}.png`}
                  width={32}
                  height={32}
                  alt={`${nodeType} icon`}
                  className="object-contain"
                />

                <span className="capitalize">
                  {nodeType === "blank1" ? "Router" : nodeType}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            side="bottom"
            align="start"
            alignItemWithTrigger={false}
          >
            <SelectGroup>
              <SelectLabel>Node Type</SelectLabel>
              {nodeTypeList.map((p, idx) => (
                <SelectItem key={idx} value={p.value}>
                  <div className="flex items-center gap-2">
                    <Image
                      src={p.image}
                      width={32}
                      height={32}
                      alt={`${p.value} icon`}
                      className="object-contain"
                    />

                    <span className="capitalize">{p.value}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className="space-y-4">
          {(
            [
              ["top", counts.top],
              ["right", counts.right],
              ["bottom", counts.bottom],
              ["left", counts.left],
            ] as const
          ).map(([position, count]) => (
            <div key={position} className="space-y-2">
              {/* Handle count */}
              <Label className="capitalize">{position} Handles</Label>

              <Input
                type="number"
                min={0}
                value={counts[position]}
                onChange={(e) =>
                  setCounts((prev) => ({
                    ...prev,
                    [position]: Number(e.target.value),
                  }))
                }
              />

              {/* Handle configuration */}
              <div className="space-y-2">
                {Array.from({ length: count }).map((_, index) => {
                  const handleId = `${position}-${index}`;

                  const existingHandle = handles[position]?.find(
                    (handle) => handle.id === handleId,
                  );
                  console.log(existingHandle);
                  console.log("Position", handleId);
                  const handleType = existingHandle?.type ?? "source";

                  return (
                    <div
                      key={handleId}
                      className="flex items-center gap-2 rounded-md border p-2"
                    >
                      {/* Handle information */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{handleId}</div>

                        {existingHandle?.interfaceName && (
                          <div className="text-xs text-muted-foreground truncate">
                            {existingHandle.interfaceName}-
                            {existingHandle.nodeName}
                          </div>
                        )}
                      </div>

                      {/* Source / Target */}
                      <Select
                        value={handleType}
                        onValueChange={(value) => {
                          const type = value as HandleType;

                          console.log("Changing handle:", {
                            position,
                            handleId,
                            type,
                          });

                          setHandles((current) => {
                            const positionHandles = current[position] ?? [];

                            return {
                              ...current,
                              [position]: positionHandles.map((handle) =>
                                handle.id === handleId
                                  ? {
                                      ...handle,
                                      type,
                                    }
                                  : handle,
                              ),
                            };
                          });
                        }}
                      >
                        <SelectTrigger className="w-30">
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="source">Source</SelectItem>

                          <SelectItem value="target">Target</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div>
            <Label>Aggregation Mode</Label>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Automatic Aggregation</div>

                <div className="text-xs text-muted-foreground">
                  Automatically aggregate interfaces connected to the same
                  handle.
                </div>
              </div>

              <Switch
                checked={aggregationMode === "automatic"}
                onCheckedChange={(checked) => {
                  setAggregationMode(checked ? "automatic" : "manual");
                }}
              />
            </div>
          </div>
        </div>
        {aggregationMode === "manual" && (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Manual Aggregation</div>

                <div className="text-xs text-muted-foreground">
                  Create aggregation groups from interfaces connected to this
                  blank node.
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAggregations((prev) => [
                    ...prev,
                    {
                      id: `agg-${Date.now()}`,
                      name: "",
                      interfaces: [],
                    },
                  ]);
                }}
              >
                Add Group
              </Button>
            </div>

            {/* Groups */}
            <div className="space-y-3">
              {aggregations.map((aggregation) => {
                const usedInterfaceIds = new Set(
                  aggregations
                    .filter((group) => group.id !== aggregation.id)
                    .flatMap((group) =>
                      group.interfaces.map((iface) => iface.id),
                    ),
                );
                return (
                  <div
                    key={aggregation.id}
                    className="space-y-3 rounded-lg border p-3"
                  >
                    {/* Group header */}
                    <div className="flex items-center gap-2">
                      <Input
                        value={aggregation.name}
                        placeholder="Aggregation name"
                        onChange={(e) => {
                          setAggregations((prev) =>
                            prev.map((item) =>
                              item.id === aggregation.id
                                ? {
                                    ...item,
                                    name: e.target.value,
                                  }
                                : item,
                            ),
                          );
                        }}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setAggregations((prev) =>
                            prev.filter((item) => item.id !== aggregation.id),
                          );
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    {/* Interfaces */}
                    <div className="space-y-2">
                      <Label className="text-xs">Interfaces</Label>

                      {aggregation.interfaces.length === 0 ? (
                        <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                          No interfaces selected
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {aggregation.interfaces.map((iface) => (
                            <div
                              key={iface.id}
                              className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                            >
                              <div>
                                <div className="text-xs font-medium">
                                  {iface.interfaceName}
                                </div>

                                {iface.nodeName && (
                                  <div className="text-[11px] text-muted-foreground">
                                    {iface.nodeName}
                                  </div>
                                )}
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  setAggregations((prev) =>
                                    prev.map((item) =>
                                      item.id === aggregation.id
                                        ? {
                                            ...item,
                                            interfaces: item.interfaces.filter(
                                              (existing) =>
                                                existing.id !== iface.id,
                                            ),
                                          }
                                        : item,
                                    ),
                                  );
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add interface */}
                      <Select
                        value=""
                        onValueChange={(interfaceId) => {
                          const interfaceToAdd = Object.values(
                            node?.data?.handles ?? {},
                          )
                            .flat()
                            .find(
                              (iface) =>
                                iface.interfaceId?.toString() === interfaceId,
                            );

                          if (!interfaceToAdd) return;

                          setAggregations((prev) =>
                            prev.map((item) => {
                              if (item.id !== aggregation.id) {
                                return item;
                              }

                              const alreadyExists = item.interfaces.some(
                                (iface) => iface.id === interfaceToAdd.id,
                              );

                              if (alreadyExists) {
                                return item;
                              }

                              return {
                                ...item,
                                interfaces: [
                                  ...item.interfaces,
                                  interfaceToAdd,
                                ],
                              };
                            }),
                          );
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Add connected interface..." />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Connected Interfaces</SelectLabel>

                            {Object.values(node?.data?.handles ?? {})
                              .flat()
                              .filter(
                                (iface) =>
                                  iface.interfaceId != null &&
                                  iface.interfaceName.trim() !== "" &&
                                  !usedInterfaceIds.has(iface.id),
                              )
                              .map((iface) => (
                                <SelectItem
                                  key={iface.id}
                                  value={iface.interfaceId!.toString()}
                                >
                                  <div>
                                    <div className="text-sm">
                                      {iface.interfaceName}
                                    </div>

                                    {iface.nodeName && (
                                      <div className="text-xs text-muted-foreground">
                                        {iface.nodeName}
                                      </div>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {aggregationMode === "manual" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Assign Aggregations</h3>

              <p className="text-xs text-muted-foreground">
                Assign an aggregation group to the handles that should
                contribute to the aggregate traffic.
              </p>
            </div>

            {(
              Object.entries(handles) as [keyof HandleLayout, NodeHandle[]][]
            ).map(([position, positionHandles]) => (
              <div key={position} className="space-y-2">
                <div className="text-sm font-medium capitalize">
                  {position} Handles
                </div>

                {positionHandles.map((handle: NodeHandle) => (
                  <div
                    key={handle.id}
                    className="rounded-md border p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{handle.id}</div>

                        {handle.interfaceName && (
                          <div className="text-xs text-muted-foreground">
                            {handle.interfaceName}
                          </div>
                        )}

                        {handle.nodeName && (
                          <div className="text-xs text-muted-foreground">
                            {handle.nodeName}
                          </div>
                        )}
                      </div>
                    </div>

                    <Select
                      value={handle.aggregationId ?? "none"}
                      onValueChange={(value) =>
                        assignAggregationToHandle(
                          position,
                          handle.id,
                          value as string,
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Assign aggregation" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="none">No aggregation</SelectItem>

                        {aggregations.map((aggregation) => (
                          <SelectItem
                            key={aggregation.id}
                            value={aggregation.id}
                          >
                            {aggregation.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button
            onClick={() => {
              onSave({
                type: nodeType,
                nodeName,

                handles: {
                  top: build("top", counts.top, handles.top),
                  right: build("right", counts.right, handles.right),
                  bottom: build("bottom", counts.bottom, handles.bottom),
                  left: build("left", counts.left, handles.left),
                },

                aggregationMode,
                aggregations,
              });

              onClose();
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
