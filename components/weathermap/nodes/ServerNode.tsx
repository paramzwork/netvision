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
export default function ServerNode({ data, selected }: NodeProps<RouterNode>) {
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
    <div className="@container relative w-full h-full rounded-sm border bg-white">
      <NodeResizer isVisible={selected} />

      <div className="h-full flex flex-col items-center justify-center p-2">
        <div className="relative w-[20cqw] h-[20cqw] max-w-20 max-h-20 min-w-9 min-h-9">
          <Image
            src="/images/server.png"
            alt="Server icon"
            fill
            sizes="100%"
            className="object-contain"
          />
        </div>
        <div className="text-[clamp(8px,5cqw,14px)] mt-1 font-semibold">
          {data.nodeName}
        </div>

        {/* <div className="text-[10px]">{data.ip}</div> */}
      </div>

      {createHandles(data.handles.top, Position.Top)}
      {createHandles(data.handles.right, Position.Right)}
      {createHandles(data.handles.bottom, Position.Bottom)}
      {createHandles(data.handles.left, Position.Left)}
    </div>
  );
}
