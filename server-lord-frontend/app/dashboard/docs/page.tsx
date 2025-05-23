"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Code } from "@/components/ui/code"
import DashboardLayout from "@/components/dashboard-layout"

export default function DocsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Documentation</h1>
          <p className="text-muted-foreground">Learn how to set up monitoring URLs for different application types</p>
        </div>

        <Tabs defaultValue="node" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="node">Node.js</TabsTrigger>
            <TabsTrigger value="go">Go</TabsTrigger>
            <TabsTrigger value="cron">Cron Jobs</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
          </TabsList>

          <TabsContent value="node">
            <Card className="bg-card/50 backdrop-blur-sm border border-green-400/20 shadow-lg">
              <CardHeader>
                <CardTitle>Node.js Monitoring Setup</CardTitle>
                <CardDescription>Integrate Server Lord monitoring with your Node.js applications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Using the HTTP Module</h3>
                  <Code className="text-sm">
                    {`// Add this to your Node.js application
const http = require('http');
const https = require('https');

// Function to ping the monitoring endpoint
function pingMonitoring() {
  const options = {
    hostname: 'api.serverlord.com',
    port: 443,
    path: '/ping/YOUR_PROCESS_ID',
    method: 'GET'
  };

  const req = https.request(options, (res) => {
    console.log('Monitoring ping sent, status:', res.statusCode);
  });

  req.on('error', (e) => {
    console.error('Error sending monitoring ping:', e);
  });

  req.end();
}

// Ping on application start
pingMonitoring();

// For long-running applications, ping periodically
setInterval(pingMonitoring, 60000); // Every minute`}
                  </Code>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Using Express.js</h3>
                  <Code className="text-sm">
                    {`// Add a health check endpoint to your Express app
const express = require('express');
const app = express();
const axios = require('axios');

// Health check endpoint
app.get('/health', (req, res) => {
  // Ping the monitoring service
  axios.get('https://api.serverlord.com/ping/YOUR_PROCESS_ID')
    .then(() => {
      console.log('Monitoring ping sent successfully');
    })
    .catch(err => {
      console.error('Error sending monitoring ping:', err);
    });
  
  // Return health status
  res.status(200).json({ status: 'healthy' });
});

// Start your server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});`}
                  </Code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="go">
            <Card className="bg-card/50 backdrop-blur-sm border border-green-400/20 shadow-lg">
              <CardHeader>
                <CardTitle>Go Monitoring Setup</CardTitle>
                <CardDescription>Integrate Server Lord monitoring with your Go applications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Basic HTTP Client</h3>
                  <Code className="text-sm">
                    {`package main

import (
	"fmt"
	"net/http"
	"time"
)

func pingMonitoring() {
	resp, err := http.Get("https://api.serverlord.com/ping/YOUR_PROCESS_ID")
	if err != nil {
		fmt.Println("Error sending monitoring ping:", err)
		return
	}
	defer resp.Body.Close()
	
	fmt.Println("Monitoring ping sent, status:", resp.Status)
}

func main() {
	// Ping on application start
	pingMonitoring()
	
	// For long-running applications, ping periodically
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			pingMonitoring()
		}
	}
}`}
                  </Code>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">With Gin Framework</h3>
                  <Code className="text-sm">
                    {`package main

import (
	"fmt"
	"net/http"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	
	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		// Ping the monitoring service
		go func() {
			resp, err := http.Get("https://api.serverlord.com/ping/YOUR_PROCESS_ID")
			if err != nil {
				fmt.Println("Error sending monitoring ping:", err)
				return
			}
			defer resp.Body.Close()
			
			fmt.Println("Monitoring ping sent, status:", resp.Status)
		}()
		
		c.JSON(200, gin.H{
			"status": "healthy",
		})
	})
	
	r.Run(":3000")
}`}
                  </Code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cron">
            <Card className="bg-card/50 backdrop-blur-sm border border-green-400/20 shadow-lg">
              <CardHeader>
                <CardTitle>Cron Job Monitoring</CardTitle>
                <CardDescription>Monitor your cron jobs and scheduled tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Using curl in a Bash Script</h3>
                  <Code className="text-sm">
                    {`#!/bin/bash

# Your regular cron job task
echo "Running scheduled task at $(date)"

# Add your task logic here
# ...

# Ping the monitoring service when the task completes successfully
curl -s "https://api.serverlord.com/ping/YOUR_PROCESS_ID"

# If you want to report the status
# curl -s "https://api.serverlord.com/ping/YOUR_PROCESS_ID?status=success"`}
                  </Code>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">In crontab</h3>
                  <Code className="text-sm">
                    {`# Add this to your crontab (crontab -e)
# Run a task every hour and ping the monitoring service

0 * * * * /path/to/your/task.sh && curl -s "https://api.serverlord.com/ping/YOUR_PROCESS_ID"

# For more complex scenarios, you can report success or failure
0 * * * * /path/to/your/task.sh && curl -s "https://api.serverlord.com/ping/YOUR_PROCESS_ID?status=success" || curl -s "https://api.serverlord.com/ping/YOUR_PROCESS_ID?status=failure"`}
                  </Code>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Monitoring script execution time</h3>
                  <Code className="text-sm">
                    {`#!/bin/bash

# Start time
start_time=$(date +%s)

# Ping start
curl -s "https://api.serverlord.com/ping/YOUR_PROCESS_ID?status=started"

# Your task
echo "Running scheduled task at $(date)"
# Add your task logic here
# ...

# End time
end_time=$(date +%s)
execution_time=$((end_time - start_time))

# Ping completion with execution time
curl -s "https://api.serverlord.com/ping/YOUR_PROCESS_ID?status=completed&duration=$execution_time"`}
                  </Code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="python">
            <Card className="bg-card/50 backdrop-blur-sm border border-green-400/20 shadow-lg">
              <CardHeader>
                <CardTitle>Python Monitoring Setup</CardTitle>
                <CardDescription>Integrate Server Lord monitoring with your Python applications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Using Requests Library</h3>
                  <Code className="text-sm">
                    {`import requests
import time
import threading

def ping_monitoring():
    try:
        response = requests.get('https://api.serverlord.com/ping/YOUR_PROCESS_ID')
        print(f"Monitoring ping sent, status: {response.status_code}")
    except Exception as e:
        print(f"Error sending monitoring ping: {e}")

# Ping on application start
ping_monitoring()

# For long-running applications, ping periodically
def periodic_ping():
    while True:
        ping_monitoring()
        time.sleep(60)  # Every minute

# Start the ping in a background thread
ping_thread = threading.Thread(target=periodic_ping, daemon=True)
ping_thread.start()

# Your application code continues here
# ...`}
                  </Code>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">With Flask Framework</h3>
                  <Code className="text-sm">
                    {`from flask import Flask, jsonify
import requests

app = Flask(__name__)

@app.route('/health')
def health_check():
    # Ping the monitoring service
    try:
        requests.get('https://api.serverlord.com/ping/YOUR_PROCESS_ID')
    except Exception as e:
        print(f"Error sending monitoring ping: {e}")
    
    # Return health status
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    # Ping on application start
    try:
        requests.get('https://api.serverlord.com/ping/YOUR_PROCESS_ID?status=started')
    except Exception as e:
        print(f"Error sending monitoring ping: {e}")
    
    app.run(host='0.0.0.0', port=5000)`}
                  </Code>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">With FastAPI</h3>
                  <Code className="text-sm">
                    {`from fastapi import FastAPI
import httpx
import asyncio

app = FastAPI()

async def ping_monitoring():
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get('https://api.serverlord.com/ping/YOUR_PROCESS_ID')
            print(f"Monitoring ping sent, status: {response.status_code}")
        except Exception as e:
            print(f"Error sending monitoring ping: {e}")

@app.get("/health")
async def health_check():
    # Ping the monitoring service asynchronously
    asyncio.create_task(ping_monitoring())
    
    # Return health status
    return {"status": "healthy"}

@app.on_event("startup")
async def startup_event():
    # Ping on application start
    await ping_monitoring()`}
                  </Code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

