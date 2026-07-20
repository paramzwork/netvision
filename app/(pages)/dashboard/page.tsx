import { StatCard } from "@/components/statcard"
import { DeviceTable } from "@/components/table/devicetable"
import { TrafficChart } from "@/components/trafficchart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold">Network Overview</h1>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Traffic"
          value="1.2 TB"
          change="+12% from yesterday"
        />
        <StatCard
          title="Active Devices"
          value="2"
          change="+0 new devices"
        />
        <StatCard
          title="Avg Latency"
          value="23ms"
          change="-2ms improvement"
        />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>CPN-1-RC</CardTitle>
        </CardHeader>
        <CardContent>
          <TrafficChart />
        </CardContent>
      </Card>
      
      <DeviceTable />
    </div>
  )
}