import type React from "react"
import { cn } from "@/lib/utils"

interface CodeProps extends React.HTMLAttributes<HTMLPreElement> {
  children: React.ReactNode
}

export function Code({ className, children, ...props }: CodeProps) {
  return (
    <pre className={cn("p-4 rounded-lg bg-black/50 text-white overflow-auto", className)} {...props}>
      <code>{children}</code>
    </pre>
  )
}

