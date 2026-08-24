import { type FC } from "react";
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
}: {
  transform: string;
  inbound?: string;
  outbound?: string;
  description: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        background: "var(--xy-theme-panel-bg)",
        padding: "2px 5px",
        color: "#2A2A2B",
        fontSize: 6,
        fontWeight: 700,
        border: "1px solid var(--xy-theme-subtle-border)",
        borderRadius: 6,
        transform,
        pointerEvents: "none",
      }}
      className="nodrag nopan"
    >
      {outbound && (
        <div className="text-center space-y-0.5 text-[10px]">
          {description}
          <div className="text-blue-500 font-bold">↑ {outbound}</div>
        </div>
      )}

      {inbound && (
        <div className="text-center space-y-0.5 text-[10px]">
          <div className="text-green-500 font-bold">↓ {inbound}</div>

          <div>{description}</div>
        </div>
      )}
    </div>
  );
}

const ViewEdgeStartEnd: FC<EdgeProps<Edge<NetworkEdgeData>>> = ({
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

  const sourceIsBlank = data?.sourceNodeType === "blank";
  const targetIsBlank = data?.targetNodeType === "blank";
  const sourceIsUp = sourceIsBlank || data?.sourceOperStatus === 1;

  const targetIsUp = targetIsBlank || data?.targetOperStatus === 1;
  const isUp = sourceIsUp && targetIsUp;
  // const sourceIsUp = sourceIsBlank || data?.status === "up";

  // const targetIsUp = targetIsBlank || data?.status === "up";
  const stroke = isUp ? "#22c55e" : "#ef4444";
  // const isUp = data?.sourceOperStatus === 1 && data?.targetOperStatus === 1;

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
  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke,
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
      ${data?.targetLabelOffset?.x ?? 0}px,
      ${data?.targetLabelOffset?.y ?? 0}px
    )
         `}
            description={data.description}
            inbound={isUp ? formatBandwidth(Number(displayInbound ?? 0)) : "0"}
          />
        )}

        {data?.sourceNodeName && (
          <EdgeLabel
            transform={`
           ${getLabelTransform(sourceX, sourceY, sourcePosition)}
            translate(
      ${data?.sourceLabelOffset?.x ?? 0}px,
      ${data?.sourceLabelOffset?.y ?? 0}px
    )
         `}
            description={data.description}
            outbound={
              isUp ? formatBandwidth(Number(displayOutbound ?? 0)) : "0"
            }
          />
        )}
      </EdgeLabelRenderer>
    </>
  );
};

export default ViewEdgeStartEnd;
