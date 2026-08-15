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
export default function SwitchNode({ data, selected }: NodeProps<RouterNode>) {
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

      <div className="flex flex-col items-center p-2">
        <Image
          src="/images/switch.png"
          width={70}
          height={70}
          priority
          alt=""
        />

        <div className="text-[clamp(8px,10cqw,14px)] mt-1 font-medium">
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
