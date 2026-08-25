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
import { InterfaceTypes } from "@/lib/types";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "./ui/combobox";

interface NodeHandleSettingsProps {
  open: boolean;
  node: TopologyNode | null;
  onClose: () => void;
  nodeType: NodeType;
  nodeName: string;
  counts: HandleCounts;

  setCounts: React.Dispatch<React.SetStateAction<HandleCounts>>;
  setNodeType: React.Dispatch<React.SetStateAction<NodeType>>;
  setNodeName: React.Dispatch<React.SetStateAction<string>>;

  handles: HandleLayout;
  aggregationMode: AggregationMode;
  aggregations: AggregationGroup[];
  setHandles: React.Dispatch<React.SetStateAction<HandleLayout>>;
  setAggregationMode: React.Dispatch<React.SetStateAction<AggregationMode>>;
  setAggregations: React.Dispatch<React.SetStateAction<AggregationGroup[]>>;

  interfaces: InterfaceTypes[];

  onSave: (settings: {
    nodeName: string;
    type: string;
    handles: HandleLayout;
    aggregationMode: AggregationMode;
    aggregations: AggregationGroup[];
  }) => void;
}
const normalNodeTypes = ["router", "switch", "cloud", "server"] as const;

const blankNodeTypes = ["blank", "blank1", "blank2"] as const;
const nodeTypeConfig = {
  router: {
    image: "router",
    label: "Router",
  },
  switch: {
    image: "switch",
    label: "Switch",
  },
  cloud: {
    image: "cloud",
    label: "Cloud",
  },
  server: {
    image: "server",
    label: "Server",
  },
  blank: {
    image: "cloud",
    label: "Blank Cloud",
  },
  blank1: {
    image: "router",
    label: "Blank Router",
  },
  blank2: {
    image: "server",
    label: "Blank Server",
  },
} as const;

export type NodeType = keyof typeof nodeTypeConfig;
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

  interfaces,

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

        interfaceName: existingHandle?.interfaceName ?? undefined,

        nodeName: existingHandle?.nodeName,

        aggregationId: existingHandle?.aggregationId,

        type: existingHandle?.type ?? "source",

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
    setHandles((current) => ({
      ...current,

      [position]: current[position].map((handle) =>
        handle.id === handleId
          ? {
              ...handle,
              aggregationId:
                aggregationId === "none" ? undefined : aggregationId,
              interfaceId: undefined,
              interfaceName: undefined,
              nodeName: undefined,
            }
          : handle,
      ),
    }));
  };
  const interfaceItems = [
    {
      id: "none",
      name: "None",
      description: "",
    },
    ...interfaces.map((iface) => ({
      id: String(iface.id),
      name: iface.name,
      description: iface.description,
    })),
  ];
  const handleClose = () => {
    setNodeType("router");
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
          onValueChange={(v) => setNodeType(v as NodeType)}
        >
          <SelectTrigger
            className="h-9! w-full! text-sm"
            aria-label="Select a preset time range"
          >
            <SelectValue placeholder="Select device">
              {nodeType && (
                <div className="flex items-center gap-2">
                  <Image
                    src={`/images/${nodeTypeConfig[nodeType].image}.png`}
                    width={32}
                    height={32}
                    alt={`${nodeTypeConfig[nodeType].label} icon`}
                    className="object-contain"
                  />

                  <span>{nodeTypeConfig[nodeType].label}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            side="bottom"
            align="start"
            alignItemWithTrigger={false}
          >
            <SelectGroup>
              <SelectLabel>Normal Nodes</SelectLabel>

              {normalNodeTypes.map((type) => {
                const config = nodeTypeConfig[type];

                return (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <Image
                        src={`/images/${config.image}.png`}
                        width={32}
                        height={32}
                        alt={`${config.label} icon`}
                        className="object-contain"
                      />

                      <span>{config.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectGroup>

            <SelectGroup>
              <SelectLabel>Blank Nodes</SelectLabel>

              {blankNodeTypes.map((type) => {
                const config = nodeTypeConfig[type];

                return (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <Image
                        src={`/images/${config.image}.png`}
                        width={32}
                        height={32}
                        alt={`${config.label} icon`}
                        className="object-contain"
                      />

                      <span>{config.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
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
                  const handleType = existingHandle?.type ?? "source";
                  const isAggregated = !!existingHandle?.aggregationId;
                  return (
                    <div
                      key={handleId}
                      className="flex items-center gap-2 rounded-md border p-2"
                    >
                      {/* Handle information */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-500">
                          {isAggregated && (
                            <div className="w-fit p-1 rounded-full bg-amber-200 border border-amber-400 text-[9px]">
                              Aggregated
                            </div>
                          )}
                          {handleId}
                        </div>

                        {existingHandle?.interfaceName && (
                          <div className="flex flex-col">
                            <span>{existingHandle.interfaceName}</span>

                            {existingHandle.nodeName && (
                              <span className="text-xs text-muted-foreground">
                                {existingHandle.nodeName}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {!isAggregated && handleType === "source" && (
                        <Combobox
                          items={interfaceItems}
                          value={
                            existingHandle?.interfaceId != null
                              ? (interfaceItems.find(
                                  (iface) =>
                                    iface.id ===
                                    String(existingHandle.interfaceId),
                                )?.name ?? "")
                              : "None"
                          }
                          onValueChange={(value) => {
                            setHandles((current) => {
                              const positionHandles = current[position] ?? [];

                              return {
                                ...current,
                                [position]: positionHandles.map((handle) =>
                                  handle.id === handleId
                                    ? value === "none"
                                      ? {
                                          ...handle,
                                          interfaceId: undefined,
                                          interfaceName: "",
                                          nodeName: undefined,
                                        }
                                      : (() => {
                                          const selectedInterface =
                                            interfaces.find(
                                              (iface) =>
                                                String(iface.id) === value,
                                            );

                                          return {
                                            ...handle,
                                            interfaceId: selectedInterface?.id,
                                            interfaceName:
                                              selectedInterface?.name ?? "",
                                            nodeName:
                                              selectedInterface?.description ??
                                              "",
                                          };
                                        })()
                                    : handle,
                                ),
                              };
                            });
                          }}
                        >
                          <ComboboxInput
                            placeholder="Select interface"
                            className="w-48"
                          />

                          <ComboboxContent>
                            <ComboboxEmpty>No interface found.</ComboboxEmpty>

                            <ComboboxList>
                              {(iface) => (
                                <ComboboxItem key={iface.id} value={iface.id}>
                                  <div className="flex flex-col">
                                    <span>{iface.name}</span>

                                    {iface.description && (
                                      <span className="text-xs text-muted-foreground">
                                        {iface.description}
                                      </span>
                                    )}
                                  </div>
                                </ComboboxItem>
                              )}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                      )}
                      {/* Source / Target */}
                      <Select
                        value={handleType}
                        onValueChange={(value) => {
                          const type = value as HandleType;
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
