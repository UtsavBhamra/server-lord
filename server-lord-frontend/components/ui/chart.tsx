"use client"

import type React from "react"

import { AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area } from "recharts"

interface ChartProps {
  children: React.ReactNode
  className?: string
}

export function Chart({ children, className }: ChartProps) {
  return <div className={`w-full rounded-md border bg-card p-4 shadow-sm ${className}`}>{children}</div>
}

interface ChartContainerProps {
  data: any[]
  children: React.ReactNode
  padding?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
}

export function ChartContainer({ data, children, padding }: ChartContainerProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={padding}>
        {children}
      </AreaChart>
    </ResponsiveContainer>
  )
}

interface ChartXAxisProps {
  dataKey: string
}

export function ChartXAxis({ dataKey }: ChartXAxisProps) {
  return <XAxis dataKey={dataKey} stroke="hsl(var(--muted-foreground))" />
}

type ChartYAxisProps = {}

export function ChartYAxis() {
  return <YAxis stroke="hsl(var(--muted-foreground))" />
}

interface ChartTooltipProps {
  content?: React.FC<any>
}

const defaultTooltipContent: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border bg-secondary p-2 text-sm">
        <p className="font-bold">{`${label}`}</p>
        {payload.map((item, index) => (
          <p key={index} className="text-muted-foreground">
            {`${item.name}: ${item.value}`}
          </p>
        ))}
      </div>
    )
  }

  return null
}

export function ChartTooltip({ content = defaultTooltipContent }: ChartTooltipProps) {
  return <Tooltip content={content} />
}

interface ChartTooltipContentProps {
  active: boolean
  payload: any[]
  label: string
}

export const ChartTooltipContent: React.FC<ChartTooltipContentProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border bg-secondary p-2 text-sm">
        <p className="font-bold">{`${label}`}</p>
        {payload.map((item, index) => (
          <p key={index} className="text-muted-foreground">
            {`${item.name}: ${item.value}`}
          </p>
        ))}
      </div>
    )
  }

  return null
}

interface ChartAreaProps {
  dataKey: string
  fill: string
  stroke: string
  strokeWidth: number
}

export function ChartArea({ dataKey, fill, stroke, strokeWidth }: ChartAreaProps) {
  return <Area type="monotone" dataKey={dataKey} stroke={stroke} fill={fill} strokeWidth={strokeWidth} />
}

