package main

import (
	"github.com/gin-gonic/gin"
	_ "github.com/jackc/pgx/v5/stdlib" // PostgreSQL driver + stdlib adapter

	// Import using relative path
	"api/auth"
	"api/db"
)

func main() {
	// Initialize database connection
	db.InitDB()
	defer db.CloseDB()

	router := gin.Default()

	// Setup basic route
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	// Setup auth routes - no need to pass db connection
	auth.SetupRoutes(router)

	// Start server
	router.Run() // listen and serve on 0.0.0.0:8080
}
