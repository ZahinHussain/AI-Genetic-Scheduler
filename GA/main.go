package main

import (
	"encoding/json"
	"fmt"
	"ga/db"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"
)

// Config holds the application configuration
type Config struct {
	Port int
}

// loadConfig loads configuration from environment variables
func loadConfig() Config {
	port := 9090 // Default port
	if portStr := os.Getenv("GA_PORT"); portStr != "" {
		if p, err := strconv.Atoi(portStr); err == nil {
			port = p
		}
	}
	return Config{Port: port}
}

// healthCheckHandler handles health check requests
func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	database := db.GetDB()

	var now time.Time
	err := database.QueryRow("SELECT NOW()").Scan(&now)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"status": "error", "message": "Database connection failed"})
		return
	}

	response := map[string]string{
		"status":    "ok",
		"timestamp": now.String(),
		"service":   "ga",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// setupRoutes configures the HTTP server routes
func setupRoutes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", healthCheckHandler)

	// Add more route handlers for GA functionality here
	mux.HandleFunc("/ga/run", func(w http.ResponseWriter, r *http.Request) {
		// Placeholder for GA algorithm execution
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "success",
			"message": "GA algorithm execution placeholder",
		})
	})

	return mux
}

func main() {
	fmt.Println("Starting GA service...")

	// Initialize the database connection
	db.InitDB()

	// Test database connection
	database := db.GetDB()
	var now time.Time
	err := database.QueryRow("SELECT NOW()").Scan(&now)
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	fmt.Printf("✅ Database connection successful! Current time: %v\n", now)

	// Load configuration
	config := loadConfig()

	// Set up HTTP server
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", config.Port),
		Handler:      setupRoutes(),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Start the server
	fmt.Printf("GA service listening on port %d...\n", config.Port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Could not start server: %v", err)
	}

	// This code will only execute when the server is shutting down
	db.CloseDB()
	fmt.Println("GA service stopped")
}
