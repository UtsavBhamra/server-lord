"use client"
import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BookOpen, LayoutDashboard, LogOut, Server, User } from "lucide-react"
import { signOut } from "next-auth/react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function DashboardLayout({ 
  children, 
  username 
}: { 
  children: React.ReactNode,
  username?: string 
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleLogout = async () => {
    // Properly sign out through NextAuth
    await signOut({
      redirect: true,
      callbackUrl: '/login'
    });
    // The signOut function will handle the redirect to login page
  }

  if (!isMounted) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-muted/40 dark w-full">
        {/* Sidebar with fixed width */}
        <Sidebar className="h-full w-64">
          {" "}
          {/* Set the sidebar width here */}
          <SidebarHeader className="border-b border-border">
            <div className="flex items-center gap-2 px-4 py-2">
              <Server className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Server Lord</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard/docs"}>
                  <Link href="/dashboard/docs">
                    <BookOpen className="h-5 w-5" />
                    <span>Docs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              {username && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/dashboard/profile"}>
                    <Link href="/dashboard/">
                      <User className="h-5 w-5" />
                      <span>{username}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6">
            <SidebarTrigger />
            <div className="flex-1" />
          </header>
          <main className="flex-1 container py-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}