package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/jackc/pgx/v5/stdlib" // PostgreSQL driver + stdlib adapter
)

// Represents an item stored in the database
type Item struct {
	ID        int       `json:"id"`
	Name      string    `json:"name" binding:"required"` // Gin binding validation
	CreatedAt time.Time `json:"created_at"`
}

// Global variable for the database connection pool (simplification for this example)
// In larger apps, consider dependency injection.
var db *sql.DB

const (
	dbTimeout = 5 * time.Second // Timeout for database operations
)

func main() {
	// --- Database Connection ---
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Provide a default for local development if needed, but env var is preferred
		log.Println("WARNING: DATABASE_URL environment variable not set, using default.")
		// Construct from individual env vars if available
		dbUser := os.Getenv("DB_USER")
		dbPassword := os.Getenv("DB_PASSWORD")
		dbName := os.Getenv("DB_NAME")
		dbHost := os.Getenv("DB_HOST")
		dbPort := os.Getenv("DB_PORT")

		if dbUser != "" && dbPassword != "" && dbName != "" {
			if dbHost == "" {
				dbHost = "db" // Default host name for Docker service
			}
			if dbPort == "" {
				dbPort = "5432" // Default PostgreSQL port
			}
			dbURL = "postgres://" + dbUser + ":" + dbPassword + "@" + dbHost + ":" + dbPort + "/" + dbName + "?sslmode=disable"
		} else {
			// Last resort default
			dbURL = "postgres://postgres:postgres@db:5432/postgres?sslmode=disable"
		}
	}

	var err error
	// Use "pgx" as the driver name with the pgx stdlib adapter
	db, err = sql.Open("pgx", dbURL)
	if err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}
	defer db.Close() // Ensure db connection is closed when main function exits

	// Verify database connection is alive
	ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
	defer cancel()
	err = db.PingContext(ctx)
	if err != nil {
		log.Fatalf("Error pinging database: %v", err)
	}
	log.Println("Successfully connected to database!")

	// --- Gin Router Setup ---
	router := gin.Default() // Includes logger and recovery middleware

	// --- Routes ---
	router.GET("/ping", pingHandler)
	router.GET("/hello", helloHandler) // New hello endpoint
	router.POST("/items", createItemHandler)
	router.GET("/items", getItemsHandler)

	// --- Start Server ---
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Default port
	}
	serverAddr := ":" + port
	log.Printf("Starting server on %s\n", serverAddr)
	if err := router.Run(serverAddr); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}

// --- Handlers ---

// pingHandler responds with a simple pong message.
func pingHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "pong"})
}

// helloHandler responds with a hello message.
func helloHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Hello, welcome to the API!"})
}

// createItemHandler handles POST requests to create a new item.
func createItemHandler(c *gin.Context) {
	var newItem Item

	// Bind JSON payload to newItem struct
	if err := c.ShouldBindJSON(&newItem); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	// Prepare SQL statement
	query := `INSERT INTO items (name) VALUES ($1) RETURNING id, created_at`

	// Use context with timeout for the database operation
	ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
	defer cancel()

	// Execute query, scanning the returned id and created_at
	err := db.QueryRowContext(ctx, query, newItem.Name).Scan(&newItem.ID, &newItem.CreatedAt)
	if err != nil {
		log.Printf("Error inserting item into database: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create item"})
		return
	}

	log.Printf("Created item: ID=%d, Name=%s", newItem.ID, newItem.Name)
	c.JSON(http.StatusCreated, newItem) // Return the created item (with ID and timestamp)
}

// getItemsHandler handles GET requests to retrieve all items.
func getItemsHandler(c *gin.Context) {
	items := []Item{} // Slice to hold results

	// Prepare SQL statement
	query := `SELECT id, name, created_at FROM items ORDER BY created_at DESC`

	// Use context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
	defer cancel()

	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		log.Printf("Error querying items from database: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve items"})
		return
	}
	defer rows.Close() // Important: close rows to release connection

	// Iterate over query results
	for rows.Next() {
		var item Item
		if err := rows.Scan(&item.ID, &item.Name, &item.CreatedAt); err != nil {
			log.Printf("Error scanning item row: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process items"})
			return
		}
		items = append(items, item)
	}

	// Check for errors during row iteration
	if err := rows.Err(); err != nil {
		log.Printf("Error during rows iteration: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process items fully"})
		return
	}

	log.Printf("Retrieved %d items", len(items))
	c.JSON(http.StatusOK, items)
}
