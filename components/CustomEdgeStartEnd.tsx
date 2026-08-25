import { useState, type FC } from "react";
import {
  EdgeLabelRenderer,
  BaseEdge,
  type Edge,
  type EdgeProps,
  Position,
  useReactFlow,
} from "@xyflow/react";
import { formatBandwidth } from "@/lib/utils";
import { TopologyEdge, TopologyNode } from "./WeatherMapComponent";
export interface EdgePosition {
  x: number;
  y: number;
}
type NetworkEdgeData = {
  sourceInterfaceId: number;
  sourceInterfaceName: string;

  sourceNodeName?: string;
  sourceNodeType?: string;

  targetNodeName?: string;
  targetNodeType?: string;

  targetInterfaceId: number;
  targetInterfaceName: string;

  description: string;

  inbound: number;
  outbound: number;
  label: string;
  sourceOperStatus: number;
  targetOperStatus: number;

  swapTraffic: boolean;
  showTrafficPanel?: boolean;

  utilization?: number;

  edgePosition?: EdgePosition;
  targetLabelOffset?: {
    x: number;
    y: number;
  };
  sourceLabelOffset?: {
    x: number;
    y: number;
  };
};

function EdgeLabel({
  transform,
  inbound,
  outbound,
  description,
  onMouseDown,
}: {
  transform: string;
  inbound?: string;
  outbound?: string;
  description: string;
  onMouseDown?: (event: React.MouseEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        background: "var(--xy-theme-panel-bg)",
        padding: "2px",
        color: "#2A2A2B",
        fontSize: 6,
        fontWeight: 700,
        border: "1px solid var(--xy-theme-subtle-border)",
        borderRadius: 5,
        transform,
        pointerEvents: "all",
        cursor: "grab",
        userSelect: "none",
      }}
      className="nodrag nopan"
      onMouseDown={onMouseDown}
    >
      {outbound && (
        <div className="text-center space-y-0.2 text-[7px]">
          {description}
          <div className="font-semibold">↑ {outbound}</div>
        </div>
      )}

      {inbound && (
        <div className="text-center space-y-0.2 text-[7px]">
          <div className="font-semibold">↓ {inbound}</div>

          <div>{description}</div>
        </div>
      )}
    </div>
  );
}

const CustomEdgeStartEnd: FC<EdgeProps<Edge<NetworkEdgeData>>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) => {
  const getLabelTransform = (x: number, y: number, position: Position) => {
    switch (position) {
      case Position.Top:
        return `translate(-50%, -100%) translate(${x}px, ${y}px)`;

      case Position.Bottom:
        return `translate(-50%, 0%) translate(${x}px, ${y}px)`;

      case Position.Left:
        return `translate(-100%, -50%) translate(${x}px, ${y}px)`;

      case Position.Right:
        return `translate(0%, -50%) translate(${x}px, ${y}px)`;

      default:
        return `translate(-50%, -50%) translate(${x}px, ${y}px)`;
    }
  };

  const isBlankNode = (nodeType?: string) =>
    nodeType === "blank" || nodeType === "blank1";

  const sourceIsBlank = isBlankNode(data?.sourceNodeType);
  const targetIsBlank = isBlankNode(data?.targetNodeType);
  const sourceIsUp = sourceIsBlank || data?.sourceOperStatus === 1;

  const targetIsUp = targetIsBlank || data?.targetOperStatus === 1;
  const isUp = sourceIsUp && targetIsUp;
  console.log(data?.sourceNodeName);
  console.log(sourceIsBlank);
  console.log(targetIsBlank);
  console.log(data?.sourceOperStatus);
  console.log(data?.targetOperStatus);
  console.log(isUp);
  const [inboundOffset, setInboundOffset] = useState(
    data?.targetLabelOffset ?? { x: 0, y: 0 },
  );

  const [outboundOffset, setOutboundOffset] = useState(
    data?.sourceLabelOffset ?? { x: 0, y: 0 },
  );

  const handleLabelMouseDown = (
    event: React.MouseEvent<HTMLDivElement>,
    type: "inbound" | "outbound",
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;

    const initialOffset = type === "inbound" ? inboundOffset : outboundOffset;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      const newOffset = {
        x: initialOffset.x + dx,
        y: initialOffset.y + dy,
      };

      if (type === "inbound") {
        setInboundOffset(newOffset);
      } else {
        setOutboundOffset(newOffset);
      }

      // Update React Flow edge data
      setEdges((edges) =>
        edges.map((edge) => {
          if (edge.id !== id) {
            return edge;
          }

          return {
            ...edge,
            data: {
              ...edge.data,
              inbound: edge.data?.inbound ?? 0,
              outbound: edge.data?.outbound ?? 0,

              sourceAdminStatus: edge.data?.sourceAdminStatus ?? 0,
              sourceOperStatus: edge.data?.sourceOperStatus ?? 0,
              sourceStatus: edge.data?.sourceStatus ?? "",

              targetAdminStatus: edge.data?.targetAdminStatus ?? 0,
              targetOperStatus: edge.data?.targetOperStatus ?? 0,
              targetStatus: edge.data?.targetStatus ?? "",
              ...(type === "inbound"
                ? {
                    targetLabelOffset: newOffset,
                  }
                : {
                    sourceLabelOffset: newOffset,
                  }),
            },
          };
        }),
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  let displayInbound = Number(data?.inbound ?? 0);
  let displayOutbound = Number(data?.outbound ?? 0);

  if (data?.swapTraffic) {
    [displayInbound, displayOutbound] = [displayOutbound, displayInbound];
  }

  const { screenToFlowPosition, setEdges } = useReactFlow<
    TopologyNode,
    TopologyEdge
  >();

  const edgePosition = data?.edgePosition ?? {
    x: 0,
    y: 0,
  };

  // ==========================================================
  // Calculate the original midpoint
  // ==========================================================

  const midpointX = (sourceX + targetX) / 2;

  const midpointY = (sourceY + targetY) / 2;

  // ==========================================================
  // Calculate the offset midpoint
  // ==========================================================

  const offsetX = midpointX + edgePosition.x;

  const offsetY = midpointY + edgePosition.y;

  // ==========================================================
  // Create draggable routed path
  // ==========================================================
  //
  // Source ────────┐
  //                │
  //                └──────── Target
  //
  // The middle route is offset by edgePosition.
  // ==========================================================

  const dx = Math.abs(targetX - sourceX);

  const dy = Math.abs(targetY - sourceY);

  // If the edge is mostly horizontal,
  // create a horizontal → vertical → horizontal route.

  const isHorizontal = dx >= dy;

  let edgePath: string;

  if (isHorizontal) {
    edgePath = `
    M ${sourceX} ${sourceY}
    L ${offsetX} ${sourceY}
    L ${offsetX} ${offsetY}
    L ${targetX} ${offsetY}
    L ${targetX} ${targetY}
  `;
  } else {
    edgePath = `
    M ${sourceX} ${sourceY}
    L ${sourceX} ${offsetY}
    L ${offsetX} ${offsetY}
    L ${offsetX} ${targetY}
    L ${targetX} ${targetY}
  `;
  }

  // ==========================================================
  // Drag edge
  // ==========================================================

  const handleEdgeMouseDown = (event: React.MouseEvent<SVGPathElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const startPosition = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const startOffset = data?.edgePosition ?? {
      x: 0,
      y: 0,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentPosition = screenToFlowPosition({
        x: moveEvent.clientX,
        y: moveEvent.clientY,
      });

      const dx = currentPosition.x - startPosition.x;

      const dy = currentPosition.y - startPosition.y;

      setEdges((edges) =>
        edges.map((edge): TopologyEdge => {
          if (edge.id !== id) {
            return edge;
          }

          return {
            ...edge,

            data: {
              ...edge.data,

              inbound: edge.data?.inbound ?? 0,
              outbound: edge.data?.outbound ?? 0,

              sourceAdminStatus: edge.data?.sourceAdminStatus ?? 0,
              sourceOperStatus: edge.data?.sourceOperStatus ?? 0,
              sourceStatus: edge.data?.sourceStatus ?? "",

              targetAdminStatus: edge.data?.targetAdminStatus ?? 0,
              targetOperStatus: edge.data?.targetOperStatus ?? 0,
              targetStatus: edge.data?.targetStatus ?? "",

              edgePosition: {
                x: startOffset.x + dx,
                y: startOffset.y + dy,
              },
            },
          };
        }),
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);

      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);

    window.addEventListener("mouseup", handleMouseUp);
  };
  const getTrafficLoadColor = (traffic: number) => {
    if (traffic <= 0) return "#ff0000";
    if (traffic <= 1_000_000) return "#bdbdbd"; // 0–1 Mbps
    if (traffic <= 10_000_000) return "#8000ff"; // 1–10 Mbps
    if (traffic <= 25_000_000) return "#7c00ff"; // 10–25 Mbps
    if (traffic <= 40_000_000) return "#0066ff"; // 25–40 Mbps
    if (traffic <= 55_000_000) return "#00bfff"; // 40–55 Mbps
    if (traffic <= 70_000_000) return "#ffff00"; // 55–70 Mbps
    if (traffic <= 85_000_000) return "#ff9900"; // 70–85 Mbps

    return "#00e600"; // >85 Mbps
  };
  const inboundColor = isUp
    ? getTrafficLoadColor(Number(displayInbound ?? 0))
    : "#ef4444";

  const outboundColor = isUp
    ? getTrafficLoadColor(Number(displayOutbound ?? 0))
    : "#ef4444";

  console.log(`%cInbound ${displayInbound}`, `color: ${inboundColor}`);
  console.log(`%cOutbound ${displayOutbound}`, `color: ${outboundColor}`);

  return (
    <>
      <defs>
        <linearGradient
          id={`traffic-gradient-${id}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          {/* Left 50% */}
          <stop offset="0%" stopColor={outboundColor} />
          <stop offset="50%" stopColor={outboundColor} />

          {/* Right 50% */}
          <stop offset="50%" stopColor={inboundColor} />
          <stop offset="100%" stopColor={inboundColor} />
        </linearGradient>
      </defs>
      <BaseEdge
        id={`${id}-border`}
        path={edgePath}
        style={{
          stroke: "#000000",
          strokeWidth: 3,
        }}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: `url(#traffic-gradient-${id})`,
          strokeWidth: 2,
          cursor: "pointer",
        }}
      />

      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="nodrag nopan"
        style={{
          pointerEvents: "stroke",
          cursor: "grab",
        }}
        onMouseDown={handleEdgeMouseDown}
      />
      <EdgeLabelRenderer>
        {data?.targetNodeName && (
          <EdgeLabel
            transform={`
        ${getLabelTransform(targetX, targetY, targetPosition)}
        translate(
          ${inboundOffset.x}px,
          ${inboundOffset.y}px
        )
      `}
            description={data.description}
            inbound={isUp ? formatBandwidth(Number(displayInbound ?? 0)) : "0"}
            onMouseDown={(event) => handleLabelMouseDown(event, "inbound")}
          />
        )}

        {data?.sourceNodeName && (
          <EdgeLabel
            transform={`
        ${getLabelTransform(sourceX, sourceY, sourcePosition)}
        translate(
          ${outboundOffset.x}px,
          ${outboundOffset.y}px
        )
      `}
            description={data.description}
            outbound={
              isUp ? formatBandwidth(Number(displayOutbound ?? 0)) : "0"
            }
            onMouseDown={(event) => handleLabelMouseDown(event, "outbound")}
          />
        )}
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdgeStartEnd;
