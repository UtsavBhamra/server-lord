"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { MoreHorizontal, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"
import { useSession } from "next-auth/react"

interface Process {
  id: number
  name: string
  status: string
  uptime: number
  lastChecked: string
}

interface ProcessCardProps {
  process: Process
  onDelete?: (id: number) => void
  onUpdate?: (id: number, updatedProcess: Process) => void
}

export function ProcessCard({ process, onDelete, onUpdate }: ProcessCardProps) {
  const { data: session, status } = useSession()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [advancedDialogOpen, setAdvancedDialogOpen] = useState(false)
  const [editedProcess, setEditedProcess] = useState({ ...process })
  const [advancedInfo, setAdvancedInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { toast } = useToast()

  const handleEditProcess = async () => {
    try {
      setLoading(true)
      const response = await axios.put(
        `http://localhost:3000/api/tasks/${process.id}`, 
        {
          name: editedProcess.name,
          status: editedProcess.status
        },
        {
          headers: {
            Authorization: `Bearer ${session?.user?.accessToken || ''}`
          }
        }
      )
      console.log("res1=",response)
      // Create updated process object with response data
      const updatedProcess = {
        ...process,
        name: editedProcess.name,
        status: editedProcess.status === "alive" ? "alive" : "dead",
        lastChecked: "just now"
      }
      
      // Call the onUpdate callback to update the process in the parent component
      if (onUpdate) {
        onUpdate(process.id, updatedProcess)
      }
      
      toast({
        title: "Process updated",
        description: "The process has been successfully updated.",
        variant: "default",
      })
      
      setEditDialogOpen(false)
    } catch (error) {
      console.error("Error updating process:", error)
      toast({
        title: "Error",
        description: "Failed to update the process. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAdvancedInfo = async () => {
    try {
      setLoading(true)
      // Make the actual API call to your backend
      const userId = session?.user?.id
      const response = await axios.get(
        `http://localhost:3000/api/tasks/${process.id}`,
        {
          headers: {
            Authorization: `Bearer ${session?.user?.accessToken || ''}`
          }
        }
      )
      console.log("task_res=",response.data)
      
      // Use the real data from the API response
      setAdvancedInfo({
        processId: response.data.task.id || Math.floor(Math.random() * 100),
        interval: response.data.task.interval || Math.floor(Math.random() * 1024),
        lastPing: response.data.task.last_ping || Math.floor(Math.random() * 10) + 1,
        name: response.data.task.name || new Date(Date.now() - Math.random() * 10000000000).toISOString(),
        pingUrl: response.data.task.ping_url,
        status: response.data.task.status,
      })
    } catch (error) {
      console.error("Error fetching advanced info:", error)
      toast({
        title: "Error",
        description: "Failed to fetch advanced information. Using fallback data.",
        variant: "destructive",
      })
      
      // Fallback to dummy data in case of error
      // setAdvancedInfo({
      //   cpu: Math.floor(Math.random() * 100),
      //   memory: Math.floor(Math.random() * 1024),
      //   threads: Math.floor(Math.random() * 10) + 1,
      //   startTime: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      //   logs: [
      //     { timestamp: new Date().toISOString(), message: "Process information unavailable." }
      //   ],
      // })

      setAdvancedInfo({
        cpu: 999,
        memory: 999,
        threads: 999,
        startTime: 999,
        logs: [
          { timestamp: new Date().toISOString(), message: "Process information unavailable." }
        ],
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProcess = async () => {
    try {
      setLoading(true)
      // Make the API call to delete the process
      await axios.delete(`http://localhost:3000/api/tasks/${process.id}`, {
        headers: {
          Authorization: `Bearer ${session?.user?.accessToken || ''}`
        }
      })
      
      // Call the onDelete callback to update the UI in the parent component
      if (onDelete) {
        onDelete(process.id)
      }
      
      toast({
        title: "Process deleted",
        description: "The process has been successfully removed from monitoring.",
        variant: "default",
      })
      
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting process:", error)
      toast({
        title: "Error",
        description: "Failed to delete the process. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20 overflow-hidden">
        <div
          className={`h-1 w-full ${process.status === "alive" ? "bg-gradient-to-r from-primary to-teal-400" : "bg-gradient-to-r from-red-500 to-red-400"}`}
        ></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{process.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={process.status === "alive" ? "default" : "destructive"}
              className={`capitalize ${process.status === "alive" ? "bg-gradient-to-r from-primary to-green-400" : ""}`}
            >
              {process.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>Edit Process Info</DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setAdvancedDialogOpen(true)
                    fetchAdvancedInfo()
                  }}
                >
                  View Advanced Information
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  Delete Process
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mt-2">Uptime percentage</p>
          <div className="text-2xl font-bold">{process.uptime.toFixed(3)}%</div>
          <Progress
            value={process.uptime}
            className="mt-2"
            indicatorclassname={process.status === "alive" ? "bg-gradient-to-r from-primary to-green-400" : ""}
          />
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Last checked: {process.lastChecked}</p>
        </CardFooter>
      </Card>

      {/* Edit Process Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Process</DialogTitle>
            <DialogDescription>Make changes to the process configuration here.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={editedProcess.name}
                onChange={(e) => setEditedProcess({ ...editedProcess, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <select
                id="status"
                value={editedProcess.status}
                onChange={(e) => setEditedProcess({ ...editedProcess, status: e.target.value })}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="alive">Alive</option>
                <option value="dead">Dead</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleEditProcess} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Advanced Information Dialog */}
      <Dialog open={advancedDialogOpen} onOpenChange={setAdvancedDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Advanced Information - {process.name}</DialogTitle>
            <DialogDescription>Detailed metrics and logs for this process.</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading advanced information...</span>
            </div>
          ) : advancedInfo ? (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Process ID</h4>
                  <p>{advancedInfo.processId}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Heartbeat Interval</h4>
                  <p>{advancedInfo.interval} sec</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Last Ping</h4>
                  <p>{advancedInfo.lastPing ? new Date(advancedInfo.lastPing).toLocaleString() : 'Never'}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Status</h4>
                  <p>{advancedInfo.status === "alive" ? "Alive" : "Dead"}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Ping URL</h4>
                  <p>{advancedInfo.pingUrl}</p>
                </div>
              </div>

            </div>
          ) : (
            <div className="py-4 text-center text-muted-foreground">No advanced information available</div>
          )}

          <DialogFooter>
            <Button onClick={() => setAdvancedDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Process</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the process "{process.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProcess} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Process"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}