"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import axios from "axios"
import { format, parseISO } from "date-fns"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

// Define the shape of data points from API
interface DataPoint {
  timestamp: string
  status?: string
  uptime_percentage: number
  uptime_seconds: number
  downtime_seconds: number
  value?: number // For chart display
  date?: string // For chart display
}

// Chart props definition
interface UptimeChartProps {
  taskId?: number
  dataKey?: "uptime_percentage" | "uptime_seconds" | "downtime_seconds"
  timeRange?: string
  maxPoints?: number
}

// Custom tooltip content component with improved visibility
function CustomTooltipContent({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) {
    return null
  }

  const data = payload[0].payload
  
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-3 shadow-md">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-zinc-400">
            Time
          </span>
          <span className="font-bold text-sm text-white">
            {data.date}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-zinc-400">
            Uptime
          </span>
          <span className="font-bold text-sm text-white">
            {data.value?.toFixed(2)}%
          </span>
        </div>
        {data.status && (
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-zinc-400">
              Status
            </span>
            <span className={`font-bold text-sm ${data.status === 'alive' ? 'text-green-400' : 'text-red-400'}`}>
              {data.status}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export function UptimeChart({ 
  taskId,
  dataKey = "uptime_percentage", 
  timeRange = "6h",
  maxPoints = 30
}: UptimeChartProps) {
  const [chartData, setChartData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()
  
  // Fallback data if API fails
  const fallbackData = [
    // { timestamp: "2025-03-30T10:00:00Z", value: 98, date: "10:00 am" },
    // { timestamp: "2025-03-30T11:00:00Z", value: 93, date: "11:00 am" },
    // { timestamp: "2025-03-30T12:00:00Z", value: 87, date: "12:00 pm" },
    // { timestamp: "2025-03-30T13:00:00Z", value: 92, date: "1:00 pm" },
    // { timestamp: "2025-03-30T14:00:00Z", value: 95, date: "2:00 pm" },
    // { timestamp: "2025-03-30T15:00:00Z", value: 75, date: "3:00 pm" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.accessToken) {
        console.log("No access token available");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log(`Fetching chart data for ${taskId ? `task ID: ${taskId}` : 'all tasks'}`);
        
        // Construct the API URL based on whether we have a taskId
        const url = taskId
          ? `http://localhost:3000/api/tasks/${taskId}/graph?timeRange=${timeRange}`
          : `http://localhost:3000/api/users/${session.user.id}/graph?timeRange=${timeRange}`;
        
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`
          }
        });
        
        console.log("API Response:", response.data);
        
        if (!response.data.points || !Array.isArray(response.data.points) || response.data.points.length === 0) {
          console.log("No chart data points available");
          setChartData([]);
          return;
        }

        // Transform the API data for the chart
        const formattedData = response.data.points.map((point: any) => ({
          timestamp: point.timestamp,
          status: point.status,
          uptime_percentage: point.uptime_percentage,
          uptime_seconds: point.uptime_seconds,
          downtime_seconds: point.downtime_seconds,
          // Set the value based on the selected dataKey
          value: point[dataKey],
          // Format date for display
          date: format(parseISO(point.timestamp), "h:mm a")
        }));
        
        console.log("Formatted chart data:", formattedData);
        
        // Remove duplicate timestamps (keep first occurrence)
        const uniqueData = formattedData.reduce((acc: DataPoint[], current: DataPoint) => {
          const existing = acc.find(item => item.timestamp === current.timestamp);
          if (!existing) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        // Sort by timestamp
        const sortedData = uniqueData.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        // Limit to maxPoints if needed
        const limitedData = sortedData.length > maxPoints 
          ? sortedData.filter((_, index) => index % Math.ceil(sortedData.length / maxPoints) === 0)
          : sortedData;
        
        setChartData(limitedData);
      } catch (error) {
        console.error("Error fetching chart data:", error);
        // Use fallback data in production
        if (process.env.NODE_ENV === 'production') {
          setChartData(fallbackData);
        } else {
          setChartData([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [taskId, timeRange, dataKey, session, maxPoints]);

  const displayData = useMemo(() => {
    return chartData.length > 0 ? chartData : fallbackData;
  }, [chartData]);

  return (
    <div style={{ width: '100%', height: '300px' }}>
      {loading ? (
        <Skeleton className="h-[300px] w-full" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={displayData}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'rgb(161, 161, 170)' }}
              axisLine={{ stroke: 'rgb(161, 161, 170)' }}
              tickLine={{ stroke: 'rgb(161, 161, 170)' }}
            />
            <YAxis
              tick={{ fill: 'rgb(161, 161, 170)' }}
              axisLine={{ stroke: 'rgb(161, 161, 170)' }}
              tickLine={{ stroke: 'rgb(161, 161, 170)' }}
              // Add a formatter for the large values
              tickFormatter={(value) => {
                return `${value}%`
              }}
            />
            <Tooltip content={<CustomTooltipContent />} />
            <Area 
              type="monotone" 
              dataKey="value"
              stroke="#22c55e" 
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)" 
              activeDot={{ r: 8, fill: '#22c55e', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}