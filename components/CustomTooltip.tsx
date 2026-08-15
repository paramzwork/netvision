import { formatBandwidth } from "@/lib/utils";
import React from "react";
interface CustomTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{ name: string; value: number; color: string }>;
  hoveredInterface: string | null;
  displayedInterfaces: Array<{ name: string }>;
  chartColors: string[];
}
export default function CustomTooltip({
  active,
  label,
  payload,
  hoveredInterface,
  displayedInterfaces,
  chartColors,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const valueMap: Record<string, number> = {};
  payload.forEach((p) => {
    valueMap[p.name] = p.value;
  });

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.97)",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: "10px 14px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
        minWidth: 220,
        fontSize: 12,
      }}
    >
      <div
        style={{
          fontWeight: 600,
          marginBottom: 8,
          color: "#334155",
          fontSize: 12,
        }}
      >
        {label}
      </div>
      {displayedInterfaces.map((iface, idx) => {
        const color = chartColors[idx];
        const value = valueMap[iface.name];
        const isHovered = hoveredInterface === iface.name;
        const isDimmed = hoveredInterface !== null && !isHovered;
        return (
          <div
            key={iface.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 3,
              opacity: isDimmed ? 0.4 : 1,
              transition: "opacity 0.15s",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: color,
                flexShrink: 0,
              }}
            />
            <span style={{ color: "#475569", flex: 1 }}>{iface.name}</span>
            <span
              style={{
                fontWeight: isHovered ? 700 : 500,
                color: isHovered ? "#0f172a" : "#64748b",
                marginLeft: 8,
              }}
            >
              {value !== undefined ? `${formatBandwidth(value)}` : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
