"use client"

import type React from "react"

import { useState } from "react"
import { AlertCircle, Copy } from "lucide-react"
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

interface AddProcessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => Promise<any>
}

// Update the form data interface to specify interval as number
interface FormData {
  pid: number | '';
  interval: number | '';
  name: string;
}

export function AddProcessDialog({ open, onOpenChange, onSubmit }: AddProcessDialogProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("details")
  const [formData, setFormData] = useState<FormData>({
    pid: '',
    interval: '',
    name: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [responseData, setResponseData] = useState<any>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Handle interval as number conversion
    if (name === 'interval' || name === 'pid') {
      // Convert to number or use empty string if input is empty
      const numValue = value === '' ? '' : parseInt(value, 10)
      setFormData((prev) => ({ ...prev, [name]: numValue }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // In a real application, you would validate the form data
    if (formData.pid === '' || formData.interval === '') {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      // Ensure interval is a valid number before submitting
      const processData = {
        ...formData,
        pid: Number(formData.pid),
        interval: Number(formData.interval)
      }

      // Submit the form and get response
      const response = await onSubmit(processData)
      setResponseData(response)
      
      // Switch to setup tab after successful submission
      setActiveTab("setup")
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: "Failed to add the process. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopySetupCommand = () => {
    // Get the copySnippet from the responseData
    const textToCopy = "curl -X POST " + responseData?.url || "No setup command available."
    
    navigator.clipboard.writeText(textToCopy)
    toast({
      title: "Copied to clipboard",
      description: "Setup command has been copied to your clipboard",
    })
  }

  const handleClose = () => {
    setFormData({
      pid: '',
      interval: '',
      name: ""
    })
    setResponseData(null)
    setActiveTab("details")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card/90 backdrop-blur-sm border-primary/20">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Process Details</TabsTrigger>
            <TabsTrigger value="setup" disabled={!responseData}>
              Setup Instructions
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <DialogHeader>
              <DialogTitle>Add New Process</DialogTitle>
              <DialogDescription>Enter the details of the process you want to monitor.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pid" className="text-right">
                    Process Id
                  </Label>
                  <Input
                    id="pid"
                    name="pid"
                    value={formData.pid}
                    onChange={handleChange}
                    className="col-span-3"
                    type='number'
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="interval" className="text-right">
                    Interval
                  </Label>
                  <Input
                    id="interval"
                    name="interval"
                    value={formData.interval}
                    onChange={handleChange}
                    className="col-span-3"
                    placeholder="3600 (in seconds)"
                    type="number"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="col-span-3"
                    placeholder=""
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" className="gradient-accent" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Continue"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          <TabsContent value="setup">
            <DialogHeader>
              <DialogTitle>Setup Instructions</DialogTitle>
              <DialogDescription>Follow these instructions to set up monitoring for your process.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Alert className="border-primary/20 bg-primary/5">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Run the following command on your server to set up monitoring for {formData.name}.
                </AlertDescription>
              </Alert>
              <div className="mt-4 relative">
                <div className="bg-muted p-4 rounded-md font-mono text-sm overflow-x-auto">
                  {responseData?.url || "Waiting for setup command..."}
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="absolute top-2 right-2" 
                  onClick={handleCopySetupCommand}
                  disabled={!responseData?.url}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Need more detailed setup instructions for different application types?{" "}
                  <Link href="/dashboard/docs" className="text-blue-500 hover:underline" onClick={handleClose}>
                    View Documentation
                  </Link>
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose} className="gradient-accent">
                Done
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}