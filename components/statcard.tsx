import { Card, CardContent } from "@/components/ui/card"

interface StatCardProps {
  title: string
  value: string
  change: string
}

export function StatCard({ title, value, change }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <h2 className="text-2xl font-bold mt-2">{value}</h2>
        <p className="text-xs text-green-500 mt-1">{change}</p>
      </CardContent>
    </Card>
  )
}