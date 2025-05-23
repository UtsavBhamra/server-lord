import { CheckCircle, Clock, Server, XCircle } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatusOverviewProps {
  processes: Array<{
    id: number
    name: string
    status: string
    uptime: number
    lastChecked: string
  }>
}

export function StatusOverview({ processes }: StatusOverviewProps) {
  // Calculate statistics
  const totalProcesses = processes.length
  const onlineProcesses = processes.filter((p) => p.status === "alive").length
  const offlineProcesses = processes.filter((p) => p.status === "dead").length
  const averageUptime = processes.reduce((acc, curr) => acc + curr.uptime, 0) / totalProcesses

  return (
    <>
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Processes</CardTitle>
          <Server className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProcesses}</div>
        </CardContent>
      </Card>
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Online</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{onlineProcesses}</div>
        </CardContent>
      </Card>
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Offline</CardTitle>
          <XCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{offlineProcesses}</div>
        </CardContent>
      </Card>
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Uptime</CardTitle>
          <Clock className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageUptime.toFixed(2)}%</div>
        </CardContent>
      </Card>
    </>
  )
}

