# ServerLord - Efficient and Scalable Cron Job Monitoring Platform

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  
  - [About the Project](#about-the-project)
  - [Built With](#built-with)
  - [Project Report](#project-report)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
  - [List of Implemented Features](#list-of-implemented-features)
  - [References Used](#references-used)
</details>

<!-- ABOUT THE PROJECT -->
## About The Project

ServerLord is a cron job manager application that provides real-time monitoring of remote tasks for multiple users, minimizing downtime by offering observability and feedback. Inspired by applications like Dead Man's Snitch and Healthchecks.io, the primary goal of Server Lord is to track and monitor cron jobs or background scripts and trigger health checks if certain jobs become inactive. Efficient cron job monitoring requires handling multiple tasks concurrently, reducing database load, and ensuring minimal latency. Scalable solutions like ServerLord use optimized database queries, concurrency mechanisms, and real-time logging to track tasks without overwhelming system resources.
![ServerLord Poster](https://private-user-images.githubusercontent.com/140042127/463497595-0fbeb7b1-3e16-40a0-95c4-1a8432cc5ea2.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NTIyNTk5NDEsIm5iZiI6MTc1MjI1OTY0MSwicGF0aCI6Ii8xNDAwNDIxMjcvNDYzNDk3NTk1LTBmYmViN2IxLTNlMTYtNDBhMC05NWM0LTFhODQzMmNjNWVhMi5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUwNzExJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MDcxMVQxODQ3MjFaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT04MDRlNjZmMWZlODZiYWJmZTM2NDI5ZDM5ZDM2YjBjZjY1ODM5YzRjN2Q1YTBlMjNhYjIzOTE4YTEyZjJjMGEyJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.TVR8yu5ScdYxHWugwk1hygH0sZDK8dukCTEGBO7DBEg)

<p align="right">(<a href="#serverlord---efficient-and-scalable-cron-job-monitoring-platform">back to top</a>)</p>

### Built With

* [![Go][Go]][Go-url]
* [![Citus][Citus]][Citus-url]
* [![Postgres][Postgres]][Postgres-url]
* [![OpenTelemetry][OTel]][OTel-url]
* [![Next][Next]][Next-url]

<p align="right">(<a href="#serverlord---efficient-and-scalable-cron-job-monitoring-platform">back to top</a>)</p>

<!-- Project Report -->
## Project Report

[Link to Report](https://docs.google.com/document/d/1xM8yf07nIHjvkzVDeLrtQjESn9wAhfsDRGIBbzG3Z9s/edit?tab=t.0)

This report details the methodology employed and highlights the outcomes achieved throughout the project. It also includes relevant UI screenshots for reference.

<p align="right">(<a href="#serverlord---efficient-and-scalable-cron-job-monitoring-platform">back to top</a>)</p>

## Getting Started

The prerequisites and installation instructions are listed in this section

### Prerequisites

1. [Download and install Golang](https://go.dev/doc/install)
2. [Download PostgreSQL](https://www.postgresql.org/download/)
3. [Download Citus Extension](https://www.citusdata.com/download/)
4. [npm (Node Package Manager)](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
 
<p align="right">(<a href="#serverlord---efficient-and-scalable-cron-job-monitoring-platform">back to top</a>)</p>

### Installation

#### Backend Setup (Go Server)

##### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/UtsavBhamra/server-lord.git
   cd server-lord-final
   ```

2. **Set up PostgreSQL with Citus**
   ```bash
   # Start PostgreSQL service
   sudo systemctl start postgresql
   sudo systemctl enable postgresql

   # Install Citus extension (follow Citus documentation for your OS)
   # Enable Citus in your database
   sudo -u postgres psql -d task_tracker -c "CREATE EXTENSION citus;"
   ```

3. **Install Go dependencies**
   ```bash
   go mod download
   ```

4. **Username and Password**
   In the ```server.go``` file, add your secret jwt key as well as postgres username and password

5. **Run the backend server**
   ```bash
   go run server.go
   ```

   The server will start on port 3000 by default. 

---

#### Frontend Setup (Next.js)

##### Steps

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

#### Running Both Services

1. **Terminal 1 - Backend:**
   ```bash
   cd backend-server-lord
   go run server.go
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

#### Troubleshooting

##### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Restart if needed
   sudo systemctl restart postgresql
   ```

2. **Port Already in Use**
   ```bash
   # Kill process using port 3000
   sudo lsof -t -i tcp:3000 | xargs kill -9
   ```

3. **Environment Variables Not Loading**
   - Ensure `.env` file is in the `backend-server-lord` directory
   - Check that `godotenv` package is installed and imported
   - Verify environment variable names match exactly

4. **Citus Extension Issues**
   ```bash
   # Check if Citus is installed
   sudo -u postgres psql -d task_tracker -c "SELECT * FROM citus_version();"
   ```

5. **Go Module Issues**
   ```bash
   # Clean and reinstall modules
   go clean -modcache
   go mod download
   ```
<p align="right">(<a href="#serverlord---efficient-and-scalable-cron-job-monitoring-platform">back to top</a>)</p>

<!-- List of Implemented Features -->
## List of Implemented Features

<details>
<summary><strong>Core Authentication & User Management</strong></summary>

1. **User Registration & Authentication** - Secure user registration with bcrypt password hashing and JWT-based authentication system
2. **Multi-User Support** - Complete isolation of tasks and data between different users with role-based access control
3. **JWT Token Management** - 24-hour token expiration with secure token generation and validation middleware
4. **Password Security** - Industry-standard bcrypt hashing for secure password storage

</details>

<details>
<summary><strong>Task Management & Monitoring</strong></summary>

1. **Cron Job Task Creation** - RESTful API endpoints for creating, updating, and deleting monitoring tasks with customizable intervals
2. **Real-time Heartbeat Tracking** - HTTP endpoint (`/tasks/{taskId}/heartbeat`) for receiving periodic signals from cron jobs
3. **Automatic Status Detection** - Intelligent monitoring that marks tasks as "dead" when heartbeats are missed beyond the configured interval
4. **Task Status Management** - Comprehensive status tracking with "alive", "dead", and warning states for approaching timeouts
5. **Individual Task Metrics** - Detailed view of each task including uptime percentage, last ping time, and status history
6. **Bulk Task Operations** - Efficient retrieval and management of all tasks belonging to a specific user

</details>

<details>
<summary><strong>Database Architecture & Performance</strong></summary>

1. **PostgreSQL with Citus Sharding** - Horizontal database scaling using Citus extension for handling large numbers of tasks
2. **Connection Pooling** - Efficient database connection management using pgxpool for optimal resource utilization
3. **Automated Schema Management** - Database initialization with proper table creation, indexes, and foreign key relationships
4. **Shard-based Monitoring** - Parallel processing of different database shards to distribute monitoring load
5. **Optimized Queries** - Efficient SQL queries with proper indexing for fast task retrieval and status updates
6. **Database Query Instrumentation** - Performance monitoring of all database operations with latency metrics

</details>

<details>
<summary><strong>Advanced Concurrency & Performance</strong></summary>

1. **Semaphore Pattern Implementation** - Controlled concurrent processing using Go channels and goroutines with configurable capacity
2. **Goroutine-based Task Monitoring** - Parallel monitoring of multiple shards using lightweight goroutines
3. **Race Condition Prevention** - Mutex-based synchronization for safe concurrent access to shared monitoring data
4. **Efficient Resource Management** - Proper cleanup and resource deallocation with defer statements and context cancellation
5. **Load Balancing** - Intelligent distribution of monitoring tasks across available system resources

</details>

<details>
<summary><strong>Real-time Monitoring & Analytics</strong></summary>

1. **Continuous Status Monitoring** - Background service running every 5 seconds to check task health across all shards
2. **Uptime/Downtime Tracking** - Precise calculation of task availability metrics with second-level granularity
3. **Historical Data Storage** - Automated storage of task performance data points for trend analysis
4. **Comprehensive Monitoring Dashboard** - Real-time display of system-wide statistics including alive/dead task counts
5. **OpenTelemetry Integration** - Complete request tracing and performance monitoring with custom span processors
6. **User-specific Graph Data** - Aggregated metrics and visualizations for all tasks belonging to a user
7. **Structured Logging** - Comprehensive logging system for debugging and system monitoring

</details>

<details>
<summary><strong>API & Integration Features</strong></summary>

1. **RESTful API Design** - Complete CRUD operations for tasks and users following REST principles
2. **JSON API Responses** - Standardized JSON responses with proper error handling and status codes
3. **Heartbeat Integration** - Simple HTTP POST endpoint for easy integration with existing cron jobs

</details>

<p align="right">(<a href="#serverlord---efficient-and-scalable-cron-job-monitoring-platform">back to top</a>)</p>

<!-- References Used -->
## References Used

* [Dead Man's Snitch](https://deadmanssnitch.com/) - Inspiration for cron job monitoring
* [Healthchecks.io](https://healthchecks.io/) - Reference implementation for heartbeat monitoring
* [Sharding PostgreSQL with Citus and Golang](https://medium.com/@bhadange.atharv/sharding-postgresql-with-citus-and-golang-on-gofiber-21a0ef5efb30) - Database sharding implementation guide
* [Handling Tens of Thousands of HTTP Requests in Golang](https://waclawthedev.medium.com/golang-handling-tens-of-thousands-of-simultaneous-http-requests-even-on-raspberry-pi-5115ca9b152d) - High-performance Go server patterns
* [Monitoring Go Apps with OpenTelemetry Metrics](https://betterstack.com/community/guides/observability/opentelemetry-metrics-golang/) - Observability and performance monitoring
* [The Complete Guide to Context in Golang](https://medium.com/@jamal.kaksouri/the-complete-guide-to-context-in-golang-efficient-concurrency-management-43d722f6eaea) - Concurrency management in Go
* [Go Documentation](https://golang.org/doc/) - Official Go language documentation
* [PostgreSQL Documentation](https://www.postgresql.org/docs/) - Database setup and optimization
* [Citus Documentation](https://docs.citusdata.com/) - Database sharding with Citus
* [OpenTelemetry Go Documentation](https://opentelemetry.io/docs/instrumentation/go/) - Observability implementation
* [Gorilla Mux Documentation](https://github.com/gorilla/mux) - HTTP router and URL matcher
* [pgx PostgreSQL Driver](https://github.com/jackc/pgx) - Go PostgreSQL driver
* [JWT-Go Library](https://github.com/golang-jwt/jwt) - JWT token implementation
* [Next.js Documentation](https://nextjs.org/docs) - Frontend framework documentation
* [React Documentation](https://react.dev/) - Frontend development
* Lots of [Stack Overflow](https://stackoverflow.com/) and [GitHub Issues](https://github.com/) for troubleshooting
* [Medium](https://medium.com/) and [DEV Community](https://dev.to/) articles for best practices
* [Reddit](https://www.reddit.com/) communities for Go and PostgreSQL discussions

<p align="right">(<a href="#serverlord---efficient-and-scalable-cron-job-monitoring-platform">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[Go]: https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white
[Go-url]: https://golang.org
[Citus]: https://img.shields.io/badge/Citus-008bb9?style=for-the-badge&logo=postgresql&logoColor=white
[Citus-url]: https://www.citusdata.com/
[Postgres]: https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white
[Postgres-url]: https://www.postgresql.org/
[OTel]: https://img.shields.io/badge/OpenTelemetry-000000?style=for-the-badge&logo=opentelemetry&logoColor=white
[OTel-url]: https://opentelemetry.io/
[Next]: https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/