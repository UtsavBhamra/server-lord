"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import Typed from "typed.js"
import { ArrowRight, CheckCircle, Server, Shield, Activity, Clock, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const typedRef = useRef(null)

  useEffect(() => {
    const typed = new Typed(typedRef.current, {
      strings: [
        "Monitor your servers with ease.",
        "Get real-time uptime analytics.",
        "Be notified instantly when issues arise.",
        "Manage all your processes in one place.",
      ],
      typeSpeed: 50,
      backSpeed: 30,
      backDelay: 1500,
      loop: true,
    })

    return () => {
      typed.destroy()
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col dark">
      <header className="sticky top-0 z-50 w-full border-b bg-[#264348]/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-6 w-6 text-green-400" />
            <span className="text-xl font-bold text-white">Server Lord</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-sm font-medium text-white hover:text-green-400">
              Features
            </Link>
            <Link href="#how-to-use" className="text-sm font-medium text-white hover:text-green-400">
              How to Use
            </Link>
            <Link href="#metrics" className="text-sm font-medium text-white hover:text-green-400">
              Metrics
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" size="sm" className="text-white border-white hover:bg-white/10">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="gradient-accent">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 gradient-hero text-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-white">Server Lord</h1>
                  <p className="max-w-[700px] text-xl md:text-2xl text-gray-200">
                    <span ref={typedRef}></span>
                  </p>
                  <p className="max-w-[700px] text-gray-300 mt-4">
                    The ultimate platform for monitoring and managing your server processes. Get real-time insights,
                    instant notifications, and comprehensive analytics.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <Link href="/signup">
                    <Button size="lg" className="gradient-accent">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#how-to-use">
                    <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-sm">
                  <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-green-400 to-green-600 opacity-75 blur"></div>
                  <div className="relative rounded-xl bg-card p-6 shadow-xl">
                    <div className="space-y-2 mb-4">
                      <div className="h-2 w-24 rounded bg-green-400/20"></div>
                      <div className="h-2 w-16 rounded bg-green-400/20"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-green-500"></div>
                        <div className="h-2 w-32 rounded bg-green-400/20"></div>
                        <div className="ml-auto h-2 w-12 rounded bg-green-400/20"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-green-500"></div>
                        <div className="h-2 w-28 rounded bg-green-400/20"></div>
                        <div className="ml-auto h-2 w-12 rounded bg-green-400/20"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-red-500"></div>
                        <div className="h-2 w-24 rounded bg-green-400/20"></div>
                        <div className="ml-auto h-2 w-12 rounded bg-green-400/20"></div>
                      </div>
                    </div>
                    <div className="mt-6 h-32 rounded-md bg-green-400/10 flex items-center justify-center">
                      <div className="h-24 w-full rounded-md bg-gradient-to-r from-green-400/20 to-green-500/20"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-[#264348] text-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-green-400 px-3 py-1 text-sm text-black">
                  Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white">
                  Everything you need to monitor your servers
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed text-white">
                  Server Lord provides a comprehensive set of tools to monitor, analyze, and manage your server
                  processes.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
              <Card className="bg-card/50 backdrop-blur-sm border-green-400/20">
                <CardHeader>
                  <div className="rounded-full w-12 h-12 flex items-center justify-center bg-green-400/10 mb-4">
                    <Activity className="h-6 w-6 text-green-400" />
                  </div>
                  <CardTitle>Real-time Monitoring</CardTitle>
                  <CardDescription>
                    Monitor your servers and processes in real-time with our advanced dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                      <span>Instant status updates</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                      <span>Detailed performance metrics</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                      <span>Custom monitoring intervals</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-green-400/20">
                <CardHeader>
                  <div className="rounded-full w-12 h-12 flex items-center justify-center bg-green-400/10 mb-4">
                    <Shield className="h-6 w-6 text-green-400" />
                  </div>
                  <CardTitle>Instant Alerts</CardTitle>
                  <CardDescription>
                    Get notified instantly when your servers go down or experience issues.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                      <span>Email notifications</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                      <span>SMS alerts for critical issues</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                      <span>Customizable alert thresholds</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-green-400/20">
                <CardHeader>
                  <div className="rounded-full w-12 h-12 flex items-center justify-center bg-green-400/10 mb-4">
                    <Clock className="h-6 w-6 text-green-400" />
                  </div>
                  <CardTitle>Comprehensive Analytics</CardTitle>
                  <CardDescription>Analyze your server performance with detailed charts and metrics.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                      <span>Historical data analysis</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                      <span>Performance trend identification</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                      <span>Exportable reports</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="how-to-use" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-green-400 px-3 py-1 text-sm text-black">
                  How to Use
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white">Get started in minutes</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed text-white">
                  Follow these simple steps to start monitoring your servers with Server Lord.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3 mt-12">
              <div className="relative">
                <div className="absolute top-0 left-6 h-full w-px bg-border"></div>
                <div className="relative flex flex-col items-start">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-400 text-green-400">
                    1
                  </div>
                  <div className="mt-4 space-y-2">
                    <h3 className="text-xl font-bold text-white">Create an account</h3>
                    <p className="text-muted-foreground text-white">
                      Sign up for a Server Lord account to get started with our monitoring services.
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute top-0 left-6 h-full w-px bg-border"></div>
                <div className="relative flex flex-col items-start">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-400 text-green-400">
                    2
                  </div>
                  <div className="mt-4 space-y-2">
                    <h3 className="text-xl font-bold text-white">Configure your server</h3>
                    <p className="text-muted-foreground text-white">
                      Connect your server(s) to start monitoring and receive real-time performance data.
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute top-0 left-6 h-full w-px bg-border"></div>
                <div className="relative flex flex-col items-start">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-400 text-green-400">
                    3
                  </div>
                  <div className="mt-4 space-y-2">
                    <h3 className="text-xl font-bold text-white">Start Monitoring</h3>
                    <p className="text-muted-foreground text-white">
                      Begin monitoring your servers, receive alerts, and analyze performance data in real-time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="metrics" className="w-full py-12 md:py-24 lg:py-32 bg-[#264348] text-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-green-400 px-3 py-1 text-sm text-black">
                  Metrics
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white">Monitor Key Metrics</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed text-white">
                  Track the most important metrics to ensure your servers are running smoothly.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
              <Card className="bg-card/50 backdrop-blur-sm border-green-400/20">
                <CardHeader>
                  <div className="rounded-full w-12 h-12 flex items-center justify-center bg-green-400/10 mb-4">
                    <Clock className="h-6 w-6 text-green-400" />
                  </div>
                  <CardTitle>Uptime</CardTitle>
                  <CardDescription>Track how long your servers have been online and their stability over time.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                      <span>Real-time uptime tracking</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                      <span>Track downtime events</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-green-400/20">
                <CardHeader>
                  <div className="rounded-full w-12 h-12 flex items-center justify-center bg-green-400/10 mb-4">
                    <Shield className="h-6 w-6 text-green-400" />
                  </div>
                  <CardTitle>CPU Usage</CardTitle>
                  <CardDescription>Monitor CPU usage and ensure your servers are not overworked.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                      <span>Track CPU load over time</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                      <span>Identify resource-hungry processes</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-green-400/20">
                <CardHeader>
                  <div className="rounded-full w-12 h-12 flex items-center justify-center bg-green-400/10 mb-4">
                    <Activity className="h-6 w-6 text-green-400" />
                  </div>
                  <CardTitle>Disk Usage</CardTitle>
                  <CardDescription>Keep an eye on disk usage to avoid running out of space.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                      <span>Track disk space usage</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                      <span>Set disk space thresholds</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

