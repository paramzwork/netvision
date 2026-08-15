"use client";

import { HandleLayout, NodeHandle } from "@/components/WeatherMapComponent";
import { Handle, Position, NodeProps, NodeResizer, Node } from "@xyflow/react";

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
export default function CloudNode({ data, selected }: NodeProps<RouterNode>) {
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
    <div className="@container relative w-full h-full min-h-13 rounded-sm border bg-white overflow-visible">
      <NodeResizer isVisible={selected} />

      <Image
        src="/images/cloud.png"
        fill
        alt="Cloud icon"
        sizes="100%"
        className="object-contain"
      />

      <div className="h-full flex flex-col items-center justify-center pointer-events-none">
        <div className="text-[clamp(6px,8cqw,14px)] font-medium mt-1 px-5">
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
