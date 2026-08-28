"use client";

import { HandleLayout, NodeHandle } from "@/components/WeatherMapComponent";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";

import Image from "next/image";

export interface RouterNodeData extends Record<string, unknown> {
  nodeName: string;
  label: string;
  description?: string;
  ip: string;

  interfaces: {
    id: number;
    name: string;
  }[];

  handles: HandleLayout;
}
export type RouterNode = Node<RouterNodeData>;
export default function CloudNode({ data }: NodeProps<RouterNode>) {
  const createHandles = (handles: NodeHandle[] | undefined, side: Position) => {
    if (!handles || handles.length === 0) return null;
    return handles.map((handle, index) => (
      <Handle
        key={handle.id}
        id={handle.id}
        position={side}
        type={handle.type}
        style={
          side === Position.Left || side === Position.Right
            ? {
                top: `${((index + 1) / (handles.length + 1)) * 100}%`,
              }
            : {
                left: `${((index + 1) / (handles.length + 1)) * 100}%`,
              }
        }
      />
    ));
  };

  return (
    <div className="@container relative w-full h-full min-h-13 rounded-sm border bg-white hover:border-blue-400 hover:shadow-sm cursor-default duration-200 overflow-visible">
      {/* <div
  className="
    group relative
    @container w-full h-full min-h-13 
    rounded-sm bg-white
    hover:cursor-default
  "
>
  <svg
    className="
      pointer-events-none
      absolute inset-0
      w-full h-full
      overflow-visible
    "
  >
    <rect
      x="1"
      y="1"
      width="calc(100% - 2px)"
      height="calc(100% - 2px)"
      rx="3"
      fill="none"
      stroke="#60a5fa"
      strokeWidth="1.5"
      pathLength="100"
      strokeDasharray="100"
      strokeDashoffset="100"
      className="
        transition-[stroke-dashoffset]
        duration-700
        group-hover:[stroke-dashoffset:0]
      "
    />
  </svg> */}
      <Image
        src="/images/cloud.png"
        fill
        alt="Cloud icon"
        sizes="100%"
        className="object-contain"
      />

      <div className="h-full flex flex-col items-center justify-center pointer-events-none">
        <div className="text-[clamp(6px,8cqw,14px)] font-semibold mt-1 px-5">
          {data.nodeName}
        </div>

        {/* <div
          className="
        text-[clamp(5px,6cqw,11px)]
        whitespace-nowrap
      "
        >
          {data.ip}
        </div> */}
      </div>

      {createHandles(data.handles.top, Position.Top)}
      {createHandles(data.handles.right, Position.Right)}
      {createHandles(data.handles.bottom, Position.Bottom)}
      {createHandles(data.handles.left, Position.Left)}
    </div>
  );
}
