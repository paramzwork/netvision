"use client" // ✅ ADD THIS AS FIRST LINE

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const data = [
  { time: "00:00", traffic: 120 },
  { time: "04:00", traffic: 300 },
  { time: "08:00", traffic: 850 },
  { time: "12:00", traffic: 650 },
  { time: "16:00", traffic: 980 },
  { time: "20:00", traffic: 720 },
  { time: "24:00", traffic: 400 },
]

export function TrafficChart() {
  return (
    <div className="h-[300px] w-full"> {/* ✅ Ensure height is defined */}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          {/* ✅ ADD THIS GRADIENT SECTION */}
          <defs>
            <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* ✅ Optional grid */}
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />

          {/* ✅ Axes */}
          <XAxis dataKey="time" />
          <YAxis />

          {/* ✅ Tooltip styling */}
          <Tooltip
            contentStyle={{
              backgroundColor: "#111",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
            }}
          />

          {/* ✅ Area definition */}
          <Area
            type="monotone"
            dataKey="traffic"
            stroke="#3b82f6"
            fill="url(#trafficGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}