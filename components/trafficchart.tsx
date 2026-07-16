"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

const data = [
  { time: "00:00", traffic: 120 },
  { time: "04:00", traffic: 300 },
  { time: "08:00", traffic: 800 },
  { time: "12:00", traffic: 600 },
  { time: "16:00", traffic: 900 },
  { time: "20:00", traffic: 700 },
]

export function TrafficChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="traffic"
            stroke="#2563eb"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}