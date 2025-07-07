package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"strconv"

	"github.com/gorilla/mux"
	"github.com/jackc/pgx/v4/pgxpool"

	"go.opentelemetry.io/otel"
	// "go.opentelemetry.io/otel/exporters/stdout/stdouttrace"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gorilla/mux/otelmux"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/sdk/resource"
	"go.opentelemetry.io/otel/sdk/trace"

	"github.com/golang-jwt/jwt"
	"github.com/rs/cors"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"-"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type Task struct {
	ID              int64      `json:"id"`
	Name            string     `json:"name"`
	PingURL         string     `json:"ping_url"`
	UserID          int64      `json:"user_id"`
	LastPing        *time.Time `json:"last_ping"`
	Interval        int        `json:"interval"`
	TaskNumber      int        `json:"task_number"`
	Status          string     `json:"status"`
	LastChecked     *time.Time `json:"last_checked"`
	PreviousStatus  string     `json:"previous_status"`
	UptimeSeconds   float64    `json:"uptime_seconds"`
	DowntimeSeconds float64    `json:"downtime_seconds"`
}

type TaskGraphPoint struct {
    ID              int64      `json:"id"`
    TaskID          int64      `json:"task_id"`
    Timestamp       time.Time  `json:"timestamp"`
    Status          string     `json:"status"`
    UptimeSeconds   float64    `json:"uptime_seconds"`
    DowntimeSeconds float64    `json:"downtime_seconds"`
    UptimePercentage float64   `json:"uptime_percentage"`
}

// JWT secret key - replace with your token/ use env variable
var jwtSecret = []byte("{YOUR_JWT_TOKEN}")

var db *pgxpool.Pool

type CustomSpanProcessor struct{}

func (c *CustomSpanProcessor) OnStart(parent context.Context, span trace.ReadWriteSpan) {}

func (c *CustomSpanProcessor) OnEnd(span trace.ReadOnlySpan) {
	// Ignore internal OpenTelemetry spans (like otelmux)
	if span.InstrumentationScope().Name == "go.opentelemetry.io/contrib/instrumentation/github.com/gorilla/mux/otelmux" {
		return
	}

	// Get span details
	route := span.Name()
	startTime := span.StartTime()
	endTime := span.EndTime()
	duration := endTime.Sub(startTime)

	// Format output
	output := fmt.Sprintf(
		"Route: %s | Start: %s | End: %s | Duration: %dms\n",
		route, startTime.Format(time.RFC3339Nano), endTime.Format(time.RFC3339Nano), duration.Milliseconds(),
	)

	os.Stdout.WriteString(output)
}

func (c *CustomSpanProcessor) Shutdown(ctx context.Context) error   { return nil }
func (c *CustomSpanProcessor) ForceFlush(ctx context.Context) error { return nil }

// Initialize OpenTelemetry with the custom span processor
func initTracer() func() {
	tp := trace.NewTracerProvider(
		trace.WithSpanProcessor(&CustomSpanProcessor{}), 
		trace.WithResource(resource.Empty()),           
	)

	otel.SetTracerProvider(tp)

	return func() {
		_ = tp.Shutdown(context.Background()) 
	}
}

// RequestLogger is a middleware that logs HTTP requests
func RequestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		log.Printf("%s %s [FROM: %s]", r.Method, r.URL.Path, r.RemoteAddr)

		next.ServeHTTP(w, r)

		duration := time.Since(start)
		log.Printf("%s %s completed in %v", r.Method, r.URL.Path, duration)
	})
}

func main() {
	// Initialize the tracer
	shutdown := initTracer()
	defer shutdown()

	// Database connection - replace {USER} and {PASSWORD} with corresponding details of your local postgres setup or use environment vars
	dbURL := "postgres://{USER}:{PASSWORD}@localhost:5432/task_tracker"
	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		log.Fatal("Error parsing the dbURL: ", err)
	}

	// Connect to database
	db, err = pgxpool.ConnectConfig(context.Background(), config)
	if err != nil {
		log.Fatal("Error connecting to database: ", err)
	}
	defer db.Close()

	// Initialize database
	err = initDB(db)
	if err != nil {
		log.Fatal("Error initializing the database: ", err)
	}

	// Start task monitor
	go startTaskMonitor()

	// Setup router
	r := mux.NewRouter()

	r.Use(RequestLogger)

	r.Use(otelmux.Middleware("task-tracker"))

	// Authentication endpoint
	r.HandleFunc("/api/login", loginHandler).Methods("POST", "OPTIONS")

	// User endpoints
	r.HandleFunc("/api/users", createUser).Methods("POST", "OPTIONS")

	// Process (task) endpoints - protected with JWT middleware
	r.HandleFunc("/api/tasks", JWTMiddleware(createTask)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/tasks/{id}", JWTMiddleware(getTask)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/users/{user_id}/tasks", JWTMiddleware(getUserTasks)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/tasks/{id}", JWTMiddleware(deleteTask)).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/api/tasks/{id}", JWTMiddleware(updateTask)).Methods("PUT", "OPTIONS")

	// old routes
	// r.HandleFunc("/register", registerHandler).Methods("POST")
	// r.HandleFunc("/tasks", createTaskHandler).Methods("POST")
	// r.HandleFunc("/users/{userId}", getUserHandler).Methods("GET")
	r.HandleFunc("/tasks/{taskId}/heartbeat", heartbeatHandler).Methods("POST")

	// User overview graph - shows combined metrics for all user tasks
	r.HandleFunc("/api/users/{user_id}/graph", JWTMiddleware(getUserGraph)).Methods("GET", "OPTIONS")
	
    // Setup CORS
	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type", "Content-Length", "Accept-Encoding", "X-CSRF-Token", "Authorization"},
		AllowCredentials: true,
		Debug:            true,
	})

	handler := corsHandler.Handler(r)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("Server starting on port %s with CORS enabled...\n", port)
	log.Printf("API endpoints available at http://localhost:%s/api\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

// Response utilities
func respondWithError(w http.ResponseWriter, code int, message string) {
	log.Printf("Error response [%d]: %s", code, message)
	respondWithJSON(w, code, map[string]string{"error": message})
}

func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Error marshalling JSON: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)

	if code >= 200 && code < 300 {
		log.Printf("Success response [%d]", code)
	}
}

// database intializer function
func initDB(db *pgxpool.Pool) error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password TEXT NOT NULL
        );`,
		`CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            ping_url VARCHAR(255),
            user_id INTEGER REFERENCES users(id),
            last_ping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            interval INTEGER NOT NULL,
            task_number INTEGER NOT NULL,
            status VARCHAR(50) DEFAULT 'alive',
            last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            previous_status VARCHAR(50) DEFAULT 'alive',
            uptime_seconds FLOAT DEFAULT 0,
            downtime_seconds FLOAT DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS task_graph_data (
            id SERIAL PRIMARY KEY,
            task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(50) NOT NULL,
            uptime_seconds FLOAT NOT NULL,
            downtime_seconds FLOAT NOT NULL,
            uptime_percentage FLOAT NOT NULL
        )`,
        `CREATE INDEX IF NOT EXISTS idx_task_graph_data_task_id ON task_graph_data (task_id)`,
        `CREATE INDEX IF NOT EXISTS idx_task_graph_data_timestamp ON task_graph_data (timestamp)`,
	}

	for _, query := range queries {
		_, err := db.Exec(context.Background(), query)
		if err != nil {
			return fmt.Errorf("error executing query: %v", err)
		}
	}

	log.Println("Database schema initialized successfully")
	return nil
}

// Authentication handlers
func loginHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Processing login request")

	var loginReq LoginRequest
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&loginReq); err != nil {
		log.Printf("Invalid request payload: %v", err)
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	// Get user from database
	var user User
	var hashedPassword string

	err := db.QueryRow(
		context.Background(),
		"SELECT id, username, email, password FROM users WHERE email = $1",
		loginReq.Email).Scan(&user.ID, &user.Username, &user.Email, &hashedPassword)

	if err != nil {
		if err.Error() == "no rows in result set" {
			log.Printf("User with email %s not found", loginReq.Email)
			respondWithError(w, http.StatusUnauthorized, "Invalid credentials")
			return
		}
		log.Printf("Error retrieving user: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Error retrieving user")
		return
	}

	// Compare passwords
	err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(loginReq.Password))
	if err != nil {
		log.Printf("Password mismatch for user %s", loginReq.Email)
		respondWithError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	// Generate JWT token
	token, err := generateToken(user)
	if err != nil {
		log.Printf("Error generating token: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Error generating token")
		return
	}

	// Return token and user info
	response := LoginResponse{
		Token: token,
		User: User{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
		},
	}

	log.Printf("User %s logged in successfully", user.Username)
	respondWithJSON(w, http.StatusOK, response)
}

// Token generation function
func generateToken(user User) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)

	claims := jwt.MapClaims{
		"id":       user.ID,
		"username": user.Username,
		"email":    user.Email,
		"iat":      time.Now().Unix(),
		"exp":      expirationTime.Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// JWT Authentication middleware
func JWTMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			respondWithError(w, http.StatusUnauthorized, "Authorization header is required")
			return
		}

		tokenString := ""
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && parts[0] == "Bearer" {
			tokenString = parts[1]
		} else {
			respondWithError(w, http.StatusUnauthorized, "Invalid authorization format")
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return jwtSecret, nil
		})

		if err != nil {
			respondWithError(w, http.StatusUnauthorized, "Invalid or expired token")
			return
		}

		if !token.Valid {
			respondWithError(w, http.StatusUnauthorized, "Invalid token")
			return
		}

		next(w, r)
	}
}

func createUser(w http.ResponseWriter, r *http.Request) {
	log.Println("Processing create user request")

	var user struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&user); err != nil {
		log.Printf("Invalid request payload: %v", err)
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	log.Printf("Creating user: %s (%s)", user.Username, user.Email)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Error processing user data")
		return
	}

	var userID int
	err = db.QueryRow(
		context.Background(),
		"INSERT INTO users(username, email, password) VALUES($1, $2, $3) RETURNING id",
		user.Username, user.Email, string(hashedPassword)).Scan(&userID)

	if err != nil {
		log.Printf("Error creating user: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Error creating user")
		return
	}

	response := map[string]interface{}{
		"id":       userID,
		"username": user.Username,
		"email":    user.Email,
	}

	log.Printf("User created successfully with ID: %d", userID)
	respondWithJSON(w, http.StatusCreated, response)
}

func createTask(w http.ResponseWriter, r *http.Request) {
	log.Println("Processing create task request")

	var task Task
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&task); err != nil {
		log.Printf("Invalid request payload: %v", err)
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	log.Printf("Creating task: %s for user ID: %d", task.Name, task.UserID)

	var exists bool
	err := db.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)", task.UserID).Scan(&exists)
	if err != nil || !exists {
		log.Printf("User ID %d does not exist", task.UserID)
		respondWithError(w, http.StatusBadRequest, "User does not exist")
		return
	}

	err = db.QueryRow(
		context.Background(),
		`INSERT INTO tasks(name, ping_url, user_id, interval, task_number, status) 
		VALUES($1, $2, $3, $4, $5, $6) RETURNING id`,
		task.Name, task.PingURL, task.UserID, task.Interval, task.TaskNumber, "alive").Scan(&task.ID)

	if err != nil {
		log.Printf("Error creating task: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Error creating task")
		return
	}

	task, err = getTaskByID(task.ID)
	if err != nil {
		log.Printf("Error fetching created task: %v", err)
	}

	log.Printf("Task created successfully with ID: %d", task.ID)
	respondWithJSON(w, http.StatusCreated, task)
}

func getTask(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    id, err := strconv.ParseInt(vars["id"], 10, 64)
    if err != nil {
        log.Printf("Invalid task ID: %s", vars["id"])
        respondWithError(w, http.StatusBadRequest, "Invalid task ID")
        return
    }

    log.Printf("Fetching task with ID: %d", id)

    task, err := getTaskByID(id)
    if err != nil {
        if strings.Contains(err.Error(), "no rows") {
            log.Printf("Task not found with ID: %d", id)
            respondWithError(w, http.StatusNotFound, "Task not found")
        } else {
            log.Printf("Error retrieving task: %v", err)
            respondWithError(w, http.StatusInternalServerError, "Error retrieving task")
        }
        return
    }
    
    // Calculate uptime percentage for enhanced task info
    totalTime := task.UptimeSeconds + task.DowntimeSeconds
    var uptimePercentage float64 = 0
    if totalTime > 0 {
        uptimePercentage = (task.UptimeSeconds / totalTime) * 100
    }
    
    // Create enhanced response with metrics included
    enhancedTask := struct {
        Task             Task    `json:"task"`
        Metrics          struct {
            UptimePercentage float64 `json:"uptime_percentage"`
            LastChecked      string  `json:"last_checked,omitempty"`
        } `json:"metrics"`
    }{
        Task: task,
        Metrics: struct {
            UptimePercentage float64 `json:"uptime_percentage"`
            LastChecked      string  `json:"last_checked,omitempty"`
        }{
            UptimePercentage: uptimePercentage,
        },
    }
    
    // Add LastChecked if available
    if task.LastChecked != nil {
        enhancedTask.Metrics.LastChecked = task.LastChecked.Format(time.RFC3339)
    }

    log.Printf("Task fetched successfully: %s (ID: %d)", task.Name, task.ID)
    respondWithJSON(w, http.StatusOK, enhancedTask)
}

func getUserTasks(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    userID, err := strconv.Atoi(vars["user_id"])
    if err != nil {
        log.Printf("Invalid user ID: %s", vars["user_id"])
        respondWithError(w, http.StatusBadRequest, "Invalid user ID")
        return
    }

    log.Printf("Fetching tasks for user ID: %d", userID)

    rows, err := db.Query(context.Background(), `
        SELECT 
            id, name, ping_url, user_id, last_ping, interval, task_number, status,
            last_checked, previous_status, uptime_seconds, downtime_seconds
        FROM tasks 
        WHERE user_id = $1`, userID)
    
    if err != nil {
        log.Printf("Error querying tasks: %v", err)
        respondWithError(w, http.StatusInternalServerError, "Error retrieving tasks")
        return
    }
    defer rows.Close()

    type EnhancedTask struct {
        Task             Task    `json:"task"`
        Metrics          struct {
            UptimePercentage float64 `json:"uptime_percentage"`
            LastChecked      string  `json:"last_checked,omitempty"`
        } `json:"metrics"`
    }

    enhancedTasks := []EnhancedTask{}
    
    for rows.Next() {
        var task Task
        if err := rows.Scan(
            &task.ID, 
            &task.Name, 
            &task.PingURL, 
            &task.UserID, 
            &task.LastPing, 
            &task.Interval, 
            &task.TaskNumber, 
            &task.Status,
            &task.LastChecked,
            &task.PreviousStatus,
            &task.UptimeSeconds,
            &task.DowntimeSeconds,
        ); err != nil {
            log.Printf("Error scanning task: %v", err)
            continue
        }
        
        // Calculate uptime percentage
        totalTime := task.UptimeSeconds + task.DowntimeSeconds
        var uptimePercentage float64 = 0
        if totalTime > 0 {
            uptimePercentage = (task.UptimeSeconds / totalTime) * 100
        }
        
        enhancedTask := EnhancedTask{
            Task: task,
            Metrics: struct {
                UptimePercentage float64 `json:"uptime_percentage"`
                LastChecked      string  `json:"last_checked,omitempty"`
            }{
                UptimePercentage: uptimePercentage,
            },
        }
        
        // Add LastChecked if available
        if task.LastChecked != nil {
            enhancedTask.Metrics.LastChecked = task.LastChecked.Format(time.RFC3339)
        }
        
        enhancedTasks = append(enhancedTasks, enhancedTask)
    }

    if err = rows.Err(); err != nil {
        log.Printf("Error iterating tasks: %v", err)
        respondWithError(w, http.StatusInternalServerError, "Error retrieving tasks")
        return
    }

    log.Printf("Retrieved %d tasks for user ID: %d", len(enhancedTasks), userID)
    respondWithJSON(w, http.StatusOK, enhancedTasks)
}

func deleteTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		log.Printf("Invalid task ID: %s", vars["id"])
		respondWithError(w, http.StatusBadRequest, "Invalid task ID")
		return
	}

	log.Printf("Deleting task with ID: %d", id)

	result, err := db.Exec(context.Background(), "DELETE FROM tasks WHERE id = $1", id)
	if err != nil {
		log.Printf("Error deleting task: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Error deleting task")
		return
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		log.Printf("Task not found with ID: %d", id)
		respondWithError(w, http.StatusNotFound, "Task not found")
		return
	}

	if rowsAffected == 0 {
		log.Printf("Task not found with ID: %d", id)
		respondWithError(w, http.StatusNotFound, "Task not found")
		return
	}

	log.Printf("Task deleted successfully with ID: %d", id)
	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Task deleted successfully"})
}

func updateTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		log.Printf("Invalid task ID: %s", vars["id"])
		respondWithError(w, http.StatusBadRequest, "Invalid task ID")
		return
	}

	log.Printf("Updating task with ID: %d", id)

	var task Task
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&task); err != nil {
		log.Printf("Invalid request payload: %v", err)
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	// First check if task exists
	_, err = getTaskByID(id)
	if err != nil {
		if strings.Contains(err.Error(), "no rows") {
			log.Printf("Task not found with ID: %d", id)
			respondWithError(w, http.StatusNotFound, "Task not found")
		} else {
			log.Printf("Error retrieving task: %v", err)
			respondWithError(w, http.StatusInternalServerError, "Error retrieving task")
		}
		return
	}

	// Update task
	_, err = db.Exec(
		context.Background(),
		`UPDATE tasks SET name = $1, ping_url = $2, interval = $3, 
        task_number = $4, status = $5 WHERE id = $6`,
		task.Name, task.PingURL, task.Interval, task.TaskNumber, task.Status, id)

	if err != nil {
		log.Printf("Error updating task: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Error updating task")
		return
	}

	// Fetch updated task
	updatedTask, err := getTaskByID(id)
	if err != nil {
		log.Printf("Error fetching updated task: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Task updated but error retrieving updated data")
		return
	}

	log.Printf("Task updated successfully: %s (ID: %d)", updatedTask.Name, updatedTask.ID)
	respondWithJSON(w, http.StatusOK, updatedTask)
}

// Helper function to get a task by ID
func getTaskByID(id int64) (Task, error) {
	var task Task
	err := db.QueryRow(
		context.Background(),
		`SELECT id, name, ping_url, user_id, last_ping, interval, task_number, status,
         last_checked, previous_status, uptime_seconds, downtime_seconds
         FROM tasks WHERE id = $1`,
		id).Scan(
		&task.ID,
		&task.Name,
		&task.PingURL,
		&task.UserID,
		&task.LastPing,
		&task.Interval,
		&task.TaskNumber,
		&task.Status,
		&task.LastChecked,
		&task.PreviousStatus,
		&task.UptimeSeconds,
		&task.DowntimeSeconds,
	)

	if err != nil {
		return task, err
	}

	return task, nil
}

// getUserGraph provides aggregated metrics for all tasks belonging to a user
func getUserGraph(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    userID, err := strconv.Atoi(vars["user_id"])
    if err != nil {
        log.Printf("Invalid user ID: %s", vars["user_id"])
        respondWithError(w, http.StatusBadRequest, "Invalid user ID")
        return
    }
    
    log.Printf("Fetching overall graph data for user ID: %d", userID)
    
    // First, get all tasks for this user
    rows, err := db.Query(context.Background(), 
        "SELECT id FROM tasks WHERE user_id = $1", userID)
    if err != nil {
        log.Printf("Error querying user tasks: %v", err)
        respondWithError(w, http.StatusInternalServerError, "Error retrieving user tasks")
        return
    }
    defer rows.Close()

    var taskIDs []int64
    for rows.Next() {
        var taskID int64
        if err := rows.Scan(&taskID); err != nil {
            log.Printf("Error scanning task ID: %v", err)
            continue
        }
        taskIDs = append(taskIDs, taskID)
    }

    if err = rows.Err(); err != nil {
        log.Printf("Error iterating tasks: %v", err)
        respondWithError(w, http.StatusInternalServerError, "Error processing tasks")
        return
    }

    if len(taskIDs) == 0 {
        log.Printf("No tasks found for user ID: %d", userID)
        respondWithJSON(w, http.StatusOK, map[string]interface{}{
            "points": []struct{}{},
            "user_id": userID,
            "time_range": "30d",
            "count": 0,
        })
        return
    }

    // Fetch the actual data points without generating a time series
    query := `
        SELECT 
            timestamp,
            SUM(CASE WHEN status = 'alive' THEN 1 ELSE 0 END) AS alive_count,
            SUM(CASE WHEN status = 'dead' THEN 1 ELSE 0 END) AS dead_count,
            AVG(uptime_percentage) AS avg_uptime_percentage,
            SUM(uptime_seconds) AS total_uptime_seconds,
            SUM(downtime_seconds) AS total_downtime_seconds
        FROM task_graph_data
        WHERE task_id = ANY($1) AND timestamp > NOW() - INTERVAL '30 days'
        GROUP BY timestamp
        ORDER BY timestamp ASC
    `

    graphRows, err := db.Query(
        context.Background(),
        query,
        taskIDs,  
    )
    
    if err != nil {
        log.Printf("Error querying aggregated graph data: %v", err)
        respondWithError(w, http.StatusInternalServerError, "Error retrieving graph data")
        return
    }
    defer graphRows.Close()

    type GraphPoint struct {
        Timestamp          string  `json:"timestamp"`
        AliveCount         int     `json:"alive_count"`
        DeadCount          int     `json:"dead_count"`
        AvgUptimePercentage float64 `json:"avg_uptime_percentage"`
        TotalUptimeSeconds  float64 `json:"total_uptime_seconds"`
        TotalDowntimeSeconds float64 `json:"total_downtime_seconds"`
        TotalTaskCount      int     `json:"total_task_count"`
        HealthScore         float64 `json:"health_score"`
    }

    var points []GraphPoint

    for graphRows.Next() {
        var (
            timestamp          time.Time
            aliveCount         int
            deadCount          int
            avgUptimePercentage float64
            totalUptimeSeconds  float64
            totalDowntimeSeconds float64
        )

        if err := graphRows.Scan(
            &timestamp,
            &aliveCount,
            &deadCount,
            &avgUptimePercentage,
            &totalUptimeSeconds,
            &totalDowntimeSeconds,
        ); err != nil {
            log.Printf("Error scanning graph data: %v", err)
            continue
        }

        // Only include points with actual data (either alive or dead counts)
        if aliveCount > 0 || deadCount > 0 || 
            totalUptimeSeconds > 0 || totalDowntimeSeconds > 0 {
            
            // Calculate total task count and health score
            totalTaskCount := aliveCount + deadCount
            healthScore := 0.0
            if totalTaskCount > 0 {
                healthScore = float64(aliveCount) / float64(totalTaskCount) * 100
            }

            // Add the point to our results
            points = append(points, GraphPoint{
                Timestamp:           timestamp.Format(time.RFC3339),
                AliveCount:          aliveCount,
                DeadCount:           deadCount,
                AvgUptimePercentage: avgUptimePercentage,
                TotalUptimeSeconds:  totalUptimeSeconds,
                TotalDowntimeSeconds: totalDowntimeSeconds,
                TotalTaskCount:       totalTaskCount,
                HealthScore:          healthScore,
            })
        }
    }

    if err = graphRows.Err(); err != nil {
        log.Printf("Error iterating graph points: %v", err)
        respondWithError(w, http.StatusInternalServerError, "Error processing graph data")
        return
    }

    // Create the final response
    response := struct {
        Points    []GraphPoint `json:"points"`
        UserID    int          `json:"user_id"`
        TimeRange string       `json:"time_range"`
        Count     int          `json:"count"`
        TaskCount int          `json:"task_count"`
    }{
        Points:    points,
        UserID:    userID,
        TimeRange: "30d",
        Count:     len(points),
        TaskCount: len(taskIDs),
    }

    log.Printf("Retrieved %d actual data points for user ID: %d (covering %d tasks)", 
        len(points), userID, len(taskIDs))
    respondWithJSON(w, http.StatusOK, response)
}

// function to handle heartbeats
func heartbeatHandler(w http.ResponseWriter, r *http.Request) {
	ctx, span := otel.Tracer("task-tracker").Start(r.Context(), "heartbeatHandler")
	defer span.End()

	vars := mux.Vars(r)
	taskID := vars["taskId"]

	query := `
		UPDATE tasks
		SET last_ping = CURRENT_TIMESTAMP, status = 'alive'
		WHERE task_number = $1
		RETURNING id`

	var id int64

	// Instrument database query
	dbCtx, dbSpan := otel.Tracer("task-tracker").Start(ctx, "dbQuery")
	err := db.QueryRow(dbCtx, query, taskID).Scan(&id) //Execute the db query
	dbSpan.End()                                       

	//Error handling
	if err != nil {
		dbSpan.RecordError(err)
		http.Error(w, "Task not found", http.StatusNotFound)
		return
	}

	// Add attributes to DB span
	dbSpan.SetAttributes(
		attribute.String("query", query),
		attribute.String("taskID", taskID),
	)

	// Instrument response writing
	_, respSpan := otel.Tracer("task-tracker").Start(ctx, "sendResponse")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Heartbeat received"})
	respSpan.End() 
}

// taskmonitoring function
// ShardInfo tracks monitoring information about shards
type ShardInfo struct {
	Name          string
	LastMonitored time.Time
}

// Global map to track when each shard was last monitored
var shardMonitoringInfo = make(map[string]*ShardInfo)
var shardMutex sync.RWMutex

func checkTaskStatus() {
	// Start an OpenTelemetry span
	ctx, span := otel.Tracer("task-tracker").Start(context.Background(), "checkTaskStatus")
	startTime := time.Now()
	defer func() {
		endTime := time.Now()
		duration := endTime.Sub(startTime)
		span.End()

		// Print timing information
		output := fmt.Sprintf("Route: checkTaskStatus | Start: %s | End: %s | Duration: %dms\n",
			startTime.Format(time.RFC3339Nano), endTime.Format(time.RFC3339Nano), duration.Milliseconds(),
		)
		os.Stdout.WriteString(output)
	}()

	log.Println("Fetching shards for task monitoring...")

	// Fetch shard names from Citus metadata
	shardQuery := `SELECT shard_name FROM citus_shards WHERE table_name = (SELECT oid FROM pg_class WHERE relname = 'tasks');`

	shardRows, err := db.Query(ctx, shardQuery)
	if err != nil {
		log.Printf("Error fetching shard names: %v", err)
		return
	}
	defer shardRows.Close()

	var shards []string
	for shardRows.Next() {
		var shardName string
		if err := shardRows.Scan(&shardName); err != nil {
			log.Printf("Error scanning shard name: %v", err)
			continue
		}
		shards = append(shards, shardName)
	}

	if len(shards) == 0 {
		log.Println("No task shards found.")
		return
	}

	log.Printf("Found %d shards: %v", len(shards), shards)

	// Create a semaphore with fixed capacity
	maxConcurrentShards := 3
	sem := make(chan struct{}, maxConcurrentShards)

	// Create a wait group to wait for all goroutines to finish
	var wg sync.WaitGroup

	// Track monitoring stats
	var monitoringSummary struct {
		sync.Mutex
		TotalTasks   int
		AliveTasks   int
		DeadTasks    int
		UpdatedTasks int
		WarningTasks int // Tasks approaching their timeout
	}

	// Process each shard
	for _, shard := range shards {
		// Check if this shard needs monitoring
		shardMutex.RLock()
		info, exists := shardMonitoringInfo[shard]
		needsMonitoring := !exists || time.Since(info.LastMonitored) > 15*time.Second
		shardMutex.RUnlock()

		if !needsMonitoring {
			log.Printf("Skipping shard %s - recently monitored at %v", shard, info.LastMonitored)
			continue
		}

		// Increment wait group counter
		wg.Add(1)

		// Acquire semaphore slot (this will block if all slots are in use)
		sem <- struct{}{}

		// Process shard in a separate goroutine
		go func(shardName string) {
			defer wg.Done()
			defer func() { <-sem }() // Release semaphore when done

			shardCtx, shardSpan := otel.Tracer("task-tracker").Start(ctx, fmt.Sprintf("process-shard-%s", shardName))
			defer shardSpan.End()

			log.Printf("Processing shard: %s", shardName)

			// First fetch all tasks to check their current status and update metrics
			fetchQuery := fmt.Sprintf(`
                SELECT 
                    id, 
                    name,
                    task_number,
                    status, 
                    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_ping)) AS time_diff, 
                    interval,
                    last_ping,
                    last_checked,
                    previous_status,
                    uptime_seconds,
                    downtime_seconds
                FROM %s;`, shardName)

			// Create DB span for fetch operation
			dbFetchCtx, dbFetchSpan := otel.Tracer("task-tracker").Start(shardCtx, "fetch-tasks")
			taskRows, err := db.Query(dbFetchCtx, fetchQuery)
			dbFetchSpan.End()

			if err != nil {
				dbFetchSpan.RecordError(err)
				log.Printf("Error fetching task statuses from shard %s: %v", shardName, err)
				return
			}
			defer taskRows.Close()

			currentTime := time.Now()
			var updatedTaskIDs []int
			var deadTasks []int

			// Local counters for this shard
			aliveCount := 0
			deadCount := 0
			warningCount := 0

			// Log output for this shard
			fmt.Printf("\n===== SHARD %s STATUS REPORT =====\n", shardName)
			fmt.Printf("%-5s | %-20s | %-10s | %-8s | %-15s | %-10s | %-15s | %-15s\n",
				"ID", "Name", "Task#", "Status", "Last Ping", "Interval", "Uptime (sec)", "Downtime (sec)")
			fmt.Println(strings.Repeat("-", 110))

			// Process each task and calculate new uptime/downtime
			for taskRows.Next() {
				var (
					taskID          int
					name            string
					taskNumber      int
					status          string
					timeDiff        float64
					interval        int
					lastPing        time.Time
					lastChecked     *time.Time
					previousStatus  string
					uptimeSeconds   float64
					downtimeSeconds float64
				)

				if err := taskRows.Scan(
					&taskID,
					&name,
					&taskNumber,
					&status,
					&timeDiff,
					&interval,
					&lastPing,
					&lastChecked,
					&previousStatus,
					&uptimeSeconds,
					&downtimeSeconds,
				); err != nil {
					log.Printf("Error scanning task row in shard %s: %v", shardName, err)
					continue
				}

				// Determine if the task should be marked as dead
				newStatus := status
				if status == "alive" && timeDiff > float64(interval) {
					newStatus = "dead"
					deadTasks = append(deadTasks, taskID)
				}

				// Update uptime/downtime based on status transitions
				newUptimeSeconds := uptimeSeconds
				newDowntimeSeconds := downtimeSeconds

				// Calculate time since last check (or last ping if no previous checks)
				// Ensure both timestamps are in UTC before subtraction
                var timeSinceLastCheck float64
                if lastChecked != nil {
                    currentTimeUTC := currentTime.UTC()
                    lastCheckedUTC := lastChecked.UTC() // Convert lastChecked to UTC

                    // Calculate the time difference in seconds
                    timeSinceLastCheck = currentTimeUTC.Sub(lastCheckedUTC).Seconds()

                    // Debug logging
                    log.Printf("Debug: currentTime=%v (UTC=%v), lastChecked=%v (UTC=%v), diff=%v",
                        currentTime, currentTimeUTC, *lastChecked, lastCheckedUTC, timeSinceLastCheck)
                } else {
                    timeSinceLastCheck = 0
                }

				// fmt.Println("\n\n\n\n\n","currentTime=", currentTime.UTC(), "\n\n\n\n\n", "lastChecked=", lastChecked, "\n\n\n\n", "timeSinceLastCheck=", timeSinceLastCheck, "\n\n\n\n\n")

				// Only add time if we have a previous check to compare with
				if timeSinceLastCheck > 0 {
					// If currently alive, add to uptime, otherwise add to downtime
					if status == "alive" {
						newUptimeSeconds += timeSinceLastCheck
					} else {
						newDowntimeSeconds += timeSinceLastCheck
					}
				}

				// Update task with new metrics
				updateQuery := fmt.Sprintf(`
                    UPDATE %s
                    SET 
                        status = $1, 
                        previous_status = $2, 
                        last_checked = $3, 
                        uptime_seconds = $4, 
                        downtime_seconds = $5
                    WHERE id = $6;`, shardName)

				_, err = db.Exec(shardCtx, updateQuery,
					newStatus,
					status, // Current status becomes previous status
					currentTime.UTC(),
					newUptimeSeconds,
					newDowntimeSeconds,
					taskID)

				if err != nil {
					log.Printf("Error updating metrics for task %d in shard %s: %v", taskID, shardName, err)
				} else {
					updatedTaskIDs = append(updatedTaskIDs, taskID)
				}

                // Calculate uptime percentage for graph data
                var uptimePercentage float64 = 0
                if newUptimeSeconds+newDowntimeSeconds > 0 {
                    uptimePercentage = (newUptimeSeconds / (newUptimeSeconds + newDowntimeSeconds)) * 100
                }

                // Store graph data point (not affected by sharding since this is a separate table)
                _, err = db.Exec(
                    shardCtx,
                    `INSERT INTO task_graph_data 
                    (task_id, timestamp, status, uptime_seconds, downtime_seconds, uptime_percentage)
                    VALUES ($1, $2, $3, $4, $5, $6)`,
                    taskID,
                    currentTime.UTC(),
                    newStatus,
                    newUptimeSeconds,
                    newDowntimeSeconds,
                    uptimePercentage,
                )

                if err != nil {
                    log.Printf("Error storing graph data for task %d: %v", taskID, err)
                }

                // To prevent the graph data table from growing too large, keep only the last 100 points
                // Run this periodically (every 10th insertion to avoid doing it too often)
                if taskID%10 == 0 {
                    _, err = db.Exec(
                        shardCtx,
                        `DELETE FROM task_graph_data 
                        WHERE id IN (
                            SELECT id FROM task_graph_data 
                            WHERE task_id = $1 
                            ORDER BY timestamp DESC 
                            OFFSET 100
                        )`,
                        taskID,
                    )
                    if err != nil {
                        log.Printf("Error pruning graph data for task %d: %v", taskID, err)
                    }
                }

				// Update counters based on new status
				if newStatus == "alive" {
					aliveCount++
				} else {
					deadCount++
				}

				// Check if task is approaching timeout (> 80% of interval passed)
				isWarning := newStatus == "alive" && timeDiff > float64(interval)*0.8
				if isWarning {
					warningCount++
				}

				// Format the output
				fmt.Printf("%-5d | %-20s | %-10d | %-8s | %-15s | %-10d | %-15.1f | %-15.1f\n",
					taskID,
					truncateString(name, 20),
					taskNumber,
					newStatus,
					lastPing.Format("15:04:05"),
					interval,
					newUptimeSeconds,
					newDowntimeSeconds,
				)
			}

			fmt.Printf("\nSHARD SUMMARY: %d total tasks (%d alive, %d dead, %d warnings)\n",
				aliveCount+deadCount, aliveCount, deadCount, warningCount)
			fmt.Println(strings.Repeat("=", 50))

			// Update global counters
			monitoringSummary.Lock()
			monitoringSummary.TotalTasks += (aliveCount + deadCount)
			monitoringSummary.AliveTasks += aliveCount
			monitoringSummary.DeadTasks += deadCount
			monitoringSummary.UpdatedTasks += len(deadTasks)
			monitoringSummary.WarningTasks += warningCount
			monitoringSummary.Unlock()

			// Update last monitored timestamp
			shardMutex.Lock()
			shardMonitoringInfo[shardName] = &ShardInfo{
				Name:          shardName,
				LastMonitored: time.Now(),
			}
			shardMutex.Unlock()

			log.Printf("Finished processing shard %s: Updated %d tasks, marked %d as dead",
				shardName, len(updatedTaskIDs), len(deadTasks))
		}(shard)
	}

	// Wait for all goroutines to complete
	wg.Wait()

	// Print overall summary
	fmt.Printf("\n===== MONITORING SUMMARY =====\n")
	fmt.Printf("Total Tasks: %d\n", monitoringSummary.TotalTasks)
	fmt.Printf("Alive Tasks: %d\n", monitoringSummary.AliveTasks)
	fmt.Printf("Dead Tasks: %d\n", monitoringSummary.DeadTasks)
	fmt.Printf("Tasks Updated to Dead: %d\n", monitoringSummary.UpdatedTasks)
	fmt.Printf("Warning Tasks (approaching timeout): %d\n", monitoringSummary.WarningTasks)
	fmt.Println(strings.Repeat("=", 30))

	log.Println("Completed task status check for all shards")
}

// Helper functions for formatting output
func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}

func warningNote(isWarning bool, interval int, timeDiff float64) string {
	if !isWarning {
		return ""
	}

	percentRemaining := 100 - (timeDiff * 100 / float64(interval))
	return fmt.Sprintf(" WARNING: %.1f%% time remaining", percentRemaining)
}

func startTaskMonitor() {
	log.Println("Starting task status monitor...")
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		checkTaskStatus()
	}
}
