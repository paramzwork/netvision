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
import { Field, FieldGroup, FieldLabel } from "./ui/field";
import { GripVertical } from "lucide-react";

interface Props {
  interfaces: InterfaceTypes[];
  devices: DeviceInfoTypes[];
  selectedDevice: string;
  setSelectedDevice: React.Dispatch<React.SetStateAction<string>>;
}

export default function SidebarWeathermap({
  interfaces,
  devices,
  selectedDevice,
  setSelectedDevice,
}: Props) {
  const [search, setSearch] = useState<string>("");
  const [, setDragItem] = useDnD();
  // const [handles, setHandles] = useState({
  //   top: 3,
  //   right: 3,
  //   bottom: 3,
  //   left: 3,
  // });
  const onDragInterface = (event: React.DragEvent, iface: InterfaceTypes) => {
    setDragItem({
      type: "interface",
      data: {
        ...iface,
        // handles,
      },
    });

    event.dataTransfer.effectAllowed = "move";
  };
  // const onDragDevice = (event: React.DragEvent, device: DeviceInfoTypes) => {
  //   setDragItem({
  //     type: "device",
  //     data: {
  //       ...device,
  //       handles,
  //     },
  //   });

  //   event.dataTransfer.effectAllowed = "move";
  // };

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
    <aside className="w-80 flex flex-col gap-3 text-xs">
      <div className="sticky top-0 space-y-3 rounded-lg bg-background border shadow-sm p-3">
        <h4 className="font-semibold">Handle Layout</h4>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="fieldgroup-device">Select Device</FieldLabel>

            <Select
              id="fieldgroup-device"
              value={selectedDevice}
              onValueChange={(v) => setSelectedDevice(v as string)}
            >
              <SelectTrigger
                className="h-9! w-full text-sm"
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
                  <SelectLabel>Devices</SelectLabel>
                  {devices.map((p, idx) => (
                    <SelectItem key={idx} value={`${p.sysName}-${p.ipAddress}`}>
                      {p.sysName}-{p.ipAddress}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <Input
              className="w-full"
              placeholder="Search interface..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>
        </FieldGroup>
      </div>
      {/* {devices.map((p, idx) => (
        <div
          key={idx}
          draggable
          onDragStart={(event) => onDragDevice(event, p)}
          className="mt-3 cursor-grab rounded-md border bg-white p-3 hover:bg-slate-50 active:cursor-grabbing"
        >
          {p.sysName}-{p.ipAddress}
        </div>
      ))} */}
      <div
        draggable
        onDragStart={onDragBlank}
        className="
    group flex cursor-grab items-center gap-3
    rounded-lg border bg-background p-3
    shadow-sm
    transition-all duration-150
    hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/40 hover:shadow-md
    active:cursor-grabbing active:scale-[0.98] active:shadow-sm
  "
      >
        {/* Drag handle */}
        <div
          className="
      flex shrink-0 items-center justify-center
      text-muted-foreground
      transition-colors
      group-hover:text-foreground
    "
        >
          <GripVertical className="size-5" />
        </div>

        {/* Node icon */}
        <div
          className="
      flex size-9 shrink-0 items-center justify-center
      rounded-md border bg-muted/50
      text-muted-foreground
      group-hover:bg-background
    "
        >
          <div className="size-3 rounded-full border-2 border-muted-foreground" />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">Blank Node</div>

          <div className="text-xs text-muted-foreground">
            Drag to the canvas
          </div>
        </div>
      </div>
      <div className="bg-background border shadow-sm p-3 rounded-md">
        <h3 className="font-bold mb-4">Interfaces</h3>
        <div className="max-h-88 overflow-y-auto">
          {filteredData
            .filter((iface) => iface.status === "1")
            .map((iface) => (
              <div
                key={iface.id}
                draggable
                onDragStart={(event) => onDragInterface(event, iface)}
                className="group flex cursor-grab items-center gap-3 rounded-lg border bg-background p-3 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/40 hover:shadow-md active:cursor-grabbing active:scale-[0.98] active:shadow-sm"
              >
                {/* Drag handle */}
                <div className="flex shrink-0 items-center justify-center text-muted-foreground transition-colors group-hover:text-foreground">
                  <GripVertical className="size-5" />
                </div>

                {/* Node icon */}
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/50 text-muted-foreground group-hover:bg-background">
                  <div className="size-3 rounded-full border-2 border-muted-foreground" />
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{iface.name}</div>

                  <div className="text-xs text-muted-foreground">
                    {iface.description}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </aside>
  );
}
