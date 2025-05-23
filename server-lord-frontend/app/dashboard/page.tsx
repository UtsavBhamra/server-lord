"use client"

import { useEffect, useState } from "react"
import { Plus, RefreshCw } from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import DashboardLayout from "@/components/dashboard-layout"
import { ProcessCard } from "@/components/process-card"
import { UptimeChart } from "@/components/uptime-chart"
import { StatusOverview } from "@/components/status-overview"
import { AddProcessDialog } from "@/components/add-process-dialog"
import { useToast } from "@/hooks/use-toast"
import { useApi } from "../lib/axios"

// Define the process type
interface Process {
  id: number
  name: string
  status: string
  uptime: number
  lastChecked: string
  url?: string
  previous_status: string
  uptime_seconds: number
  downtime_seconds: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [showAddProcess, setShowAddProcess] = useState(false)
  const [processes, setProcesses] = useState<Process[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const api = useApi()
  const { toast } = useToast()

  // If session is loading or not authenticated, show loading
  if (status === "loading" || !session) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4 text-white">Loading...</h2>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Fetch processes from the backend
  const fetchProcesses = async () => {
    try {
      if (!refreshing) setLoading(true)
      // Use the user ID from the session
      const userId = session.user.id
      const response = await api.get(`/users/${userId}/tasks`)
      console.log("refresh res=",response)
  
      // Process the response data with actual metrics from the API
      const processesWithRealData = response.data.map((processData) => ({
        id: processData.task.id,
        name: processData.task.name,
        status: processData.task.status,
        uptime: processData.metrics.uptime_percentage || 0,
        lastChecked: new Date(processData.metrics.last_checked).toLocaleString(),
        url: processData.task.ping_url || null,
        // Add the additional fields from the Process interface
        previous_status: processData.task.previous_status,
        uptime_seconds: processData.task.uptime_seconds,
        downtime_seconds: processData.task.downtime_seconds
      }));
      console.log(processesWithRealData)

      setProcesses(processesWithRealData);
      setError(null)
      
      if (refreshing) {
        toast({
          title: "Refreshed",
          description: "Process data has been updated.",
          variant: "default",
        })
      }
    } catch (err) {
      console.error("Error fetching processes:", err)
      setError("Failed to load processes. Please try again later.")
      toast({
        title: "Error",
        description: "Failed to load processes from the server.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Handle refresh with visual feedback
  const handleRefresh = async () => {
    if (refreshing || loading) return
    setRefreshing(true)
    await fetchProcesses()
  }

  // Initial fetch of processes
  useEffect(() => {
    if (session) {
      fetchProcesses()
    }
    // Include session in the dependency array to refetch when session changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const addProcess = async (process: { name: string, interval: number, pid: number }) => {
    try {
      // Send the new process to the backend with user ID from session
      const response = await api.post(
        "/tasks", 
        {
          user_id: parseInt(session.user.id),
          name: process.name,
          status: "pending",
          interval: process.interval,
          task_number: process.pid,
          ping_url: `http://localhost:3000/tasks/${process.pid}/heartbeat` // https://exampleurl/12
        }
      )
  
      // Process the response as before
      const newProcess: Process = {
        id: response.data.id,
        name: response.data.name,
        status: response.data.status === "alive" ? "alive" : "dead",
        uptime: 0,
        lastChecked: "just now",
        url: response.data.ping_url || null,
      }
  
      setProcesses([...processes, newProcess])
  
      toast({
        title: "Process added",
        description: "The new process has been added to monitoring.",
        variant: "default",
      })
  
      return newProcess
    } catch (err) {
      console.error("Error adding process:", err)
      toast({
        title: "Error",
        description: "Failed to add the process. Please try again.",
        variant: "destructive",
      })
      throw err
    }
  }

  const handleDeleteProcess = async (id: number) => {
    try {
      // Process is deleted in the ProcessCard component
      // This function is called by the ProcessCard to update the UI
      setProcesses(processes.filter((process) => process.id !== id))
    } catch (err) {
      console.error("Error updating process list after deletion:", err)
      // Refresh the entire list to ensure consistency
      fetchProcesses()
    }
  }

  const handleUpdateProcess = (id: number, updatedProcess: Process) => {
    try {
      // Update the process in the processes array
      setProcesses(processes.map(process => 
        process.id === id ? { ...process, ...updatedProcess } : process
      ))
    } catch (err) {
      console.error("Error updating process list:", err)
      // Refresh the entire list to ensure consistency
      fetchProcesses()
    }
  }

  return (
    <DashboardLayout username={session.user.name}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={refreshing || loading}
              className="bg-card/50 backdrop-blur-sm border-green-400/20 hover:bg-green-400/10 hover:border-green-400/30"
            >
              <RefreshCw 
                className={`h-4 w-4 text-white ${refreshing ? 'animate-spin' : ''}`} 
              />
              <span className="ml-1 text-white">Refresh</span>
            </Button>
          </div>
          <p className="text-gray-400 mt-1">Welcome, {session.user.name}!</p>
        </div>
        <Button onClick={() => setShowAddProcess(true)} className="gradient-accent">
          <Plus className="mr-2 h-4 w-4" />
          Add Process
        </Button>
      </div>

      {error && <div className="bg-destructive/20 text-destructive-foreground p-4 rounded-lg mb-6">{error}</div>}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-green-400/20 shadow-lg p-6 h-24 animate-pulse" />
          <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-green-400/20 shadow-lg p-6 h-24 animate-pulse" />
          <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-green-400/20 shadow-lg p-6 h-24 animate-pulse" />
          <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-green-400/20 shadow-lg p-6 h-24 animate-pulse" />
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatusOverview processes={processes} />
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-green-400/20 shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Uptime Overview</h2>
              <UptimeChart dataKey="avg_uptime_percentage" />
            </div>
            
          </div>

          <h2 className="text-xl font-semibold mb-4 text-white">Monitored Processes</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {processes.map((process) => (
              <ProcessCard 
                key={process.id} 
                process={process} 
                onDelete={handleDeleteProcess}
                onUpdate={handleUpdateProcess}
              />
            ))}
          </div>
        </>
      )}

      <AddProcessDialog open={showAddProcess} onOpenChange={setShowAddProcess} onSubmit={addProcess} />
    </DashboardLayout>
  )
}