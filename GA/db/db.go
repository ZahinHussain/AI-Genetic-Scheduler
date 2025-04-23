package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"sync"

	_ "github.com/jackc/pgx/v5/stdlib" // PostgreSQL driver
	"github.com/joho/godotenv"
)

var (
	db     *sql.DB
	dbOnce sync.Once
)

// InitDB initializes the database connection
func InitDB() {
	dbOnce.Do(func() {
		// Load environment variables from .env file
		if err := godotenv.Load(); err != nil {
			log.Printf("Warning: .env file not found, using environment variables")
		}

		// Get database connection details from environment variables
		host := getEnv("DB_HOST", "db")
		port := getEnv("DB_PORT", "5432")
		user := getEnv("DB_USER", "chronomind")
		password := getEnv("DB_PASSWORD", "")
		dbname := getEnv("DB_NAME", "chronomind")
		sslmode := getEnv("DB_SSLMODE", "disable")

		// Create connection string
		connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
			host, port, user, password, dbname, sslmode)

		// Open database connection
		var err error
		db, err = sql.Open("pgx", connStr)
		if err != nil {
			log.Fatalf("Failed to connect to database: %v", err)
		}

		// Test the connection
		err = db.Ping()
		if err != nil {
			log.Fatalf("Failed to ping database: %v", err)
		}

		log.Println("Database connection successful")
	})
}

// GetDB returns the database connection
func GetDB() *sql.DB {
	if db == nil {
		InitDB()
	}
	return db
}

// CloseDB closes the database connection
func CloseDB() {
	if db != nil {
		db.Close()
		db = nil
	}
}

// Helper function to get environment variables with default values
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
