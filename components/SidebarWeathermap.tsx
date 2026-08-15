"use client";

import { DeviceInfoTypes, InterfaceTypes } from "@/lib/types";
import { BlankNodeData, useDnD } from "./DnDContext";
import { useState } from "react";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface Props {
  interfaces: InterfaceTypes[];
  devices: DeviceInfoTypes[];
}

export default function SidebarWeathermap({ interfaces, devices }: Props) {
  const [search, setSearch] = useState<string>("");
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [, setDragItem] = useDnD();
  const [handles, setHandles] = useState({
    top: 3,
    right: 3,
    bottom: 3,
    left: 3,
  });
  const onDragInterface = (event: React.DragEvent, iface: InterfaceTypes) => {
    setDragItem({
      type: "interface",
      data: {
        ...iface,
        handles,
      },
    });

    event.dataTransfer.effectAllowed = "move";
  };
  const onDragDevice = (event: React.DragEvent, device: DeviceInfoTypes) => {
    setDragItem({
      type: "device",
      data: {
        ...device,
        handles,
      },
    });

    event.dataTransfer.effectAllowed = "move";
  };

  const onDragBlank = (event: React.DragEvent) => {
    const blankData: BlankNodeData = {
      nodeName: "",
      label: "Blank Node",
      ip: "",
      description: "",
      handles: {
        top: [],
        right: [],
        bottom: [],
        left: [],
      },
      aggregationMode: "automatic",

      aggregations: [],
    };

    setDragItem({
      type: "blank",
      data: blankData,
    });

    event.dataTransfer.effectAllowed = "move";
  };

  const filteredData = interfaces.filter((iface) => {
    const selectedIp = selectedDevice.split("-").pop()?.trim();
    const keyword = search.toLowerCase();

    return (
      iface.deviceIp === selectedIp &&
      (iface.name.toLowerCase().includes(keyword) ||
        iface.description?.toLowerCase().includes(keyword) ||
        iface.index.toString().includes(keyword))
    );
  });

  return (
    <aside className="w-80 border-r p-4">
      <div className="sticky top-0 space-y-3 mb-5 rounded-lg bg-white border p-3">
        <h4 className="font-semibold">Handle Layout</h4>
        <Input
          className="w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs">Top</label>
            <Input
              type="number"
              min={0}
              value={handles.top}
              onChange={(e) =>
                setHandles((h) => ({
                  ...h,
                  top: Number(e.target.value),
                }))
              }
            />
          </div>

          <div>
            <label className="text-xs">Right</label>
            <Input
              type="number"
              min={0}
              value={handles.right}
              onChange={(e) =>
                setHandles((h) => ({
                  ...h,
                  right: Number(e.target.value),
                }))
              }
            />
          </div>

          <div>
            <label className="text-xs">Bottom</label>
            <Input
              type="number"
              min={0}
              value={handles.bottom}
              onChange={(e) =>
                setHandles((h) => ({
                  ...h,
                  bottom: Number(e.target.value),
                }))
              }
            />
          </div>

          <div>
            <label className="text-xs">Left</label>
            <Input
              type="number"
              min={0}
              value={handles.left}
              onChange={(e) =>
                setHandles((h) => ({
                  ...h,
                  left: Number(e.target.value),
                }))
              }
            />
          </div>
        </div>
        <Select
          value={selectedDevice}
          onValueChange={(v) => setSelectedDevice(v as string)}
        >
          <SelectTrigger
            className="h-9! w-50! text-sm"
            aria-label="Select a preset time range"
          >
            <SelectValue placeholder="Select device">
              {selectedDevice}
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            side="bottom"
            align="start"
            alignItemWithTrigger={false}
          >
            <SelectGroup>
              <SelectLabel>Presets</SelectLabel>
              {devices.map((p, idx) => (
                <SelectItem key={idx} value={`${p.sysName}-${p.ipAddress}`}>
                  {p.sysName}-{p.ipAddress}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {/* <Select
          value={selectedInterface}
          onValueChange={(v) => setSelectedInterface(v as string)}
        >
          <SelectTrigger
            className="h-9! w-50! text-sm"
            aria-label="Select a preset time range"
          >
            <SelectValue placeholder="Select inteface">
              {selectedInterface}
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            side="bottom"
            align="start"
            alignItemWithTrigger={false}
          >
            <SelectGroup>
              <SelectLabel>Presets</SelectLabel>
              {filteredData.map((p, idx) => (
                <SelectItem key={idx} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select> */}
      </div>
      {devices.map((p, idx) => (
        <div
          key={idx}
          draggable
          onDragStart={(event) => onDragDevice(event, p)}
          className="mt-3 cursor-grab rounded-md border bg-white p-3 hover:bg-slate-50 active:cursor-grabbing"
        >
          {p.sysName}-{p.ipAddress}
        </div>
      ))}
      <div
        draggable
        onDragStart={onDragBlank}
        className="mt-3 cursor-grab rounded-md border bg-white p-3 hover:bg-slate-50 active:cursor-grabbing"
      >
        <div className="font-medium text-sm">Blank Node</div>

        <div className="text-xs text-muted-foreground">Drag to the canvas</div>
      </div>
      <h3 className="font-bold mb-4">Interfaces</h3>
      <div className="max-h-100 overflow-y-auto">
        {filteredData
          .filter((iface) => iface.status === "1")
          .map((iface) => (
            <div
              key={iface.id}
              className="dndnode cursor-grabrounded border p-3 mb-2 rounded-sm"
              draggable
              onDragStart={(event) => onDragInterface(event, iface)}
            >
              <div className="font-semibold">{iface.name}</div>

              <div className="text-sm">{iface.description}</div>

              <div className="text-xs text-green-600">UP</div>
            </div>
          ))}
      </div>
    </aside>
  );
}
