package main

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/jackc/pgx/v5/stdlib" // PostgreSQL driver + stdlib adapter

	// Import using relative path
	"api/auth"
	"api/calendar"
	"api/db"
	"api/ga"
	"api/oneofftasks"
	"api/recurringtasks"
	"api/settings"
)

func main() {
	// Initialize database connection
	db.InitDB()
	defer db.CloseDB()

	router := gin.Default()

	// Configure CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:8000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           86400, // 24 hours
	}))

	// Setup basic route
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	// Setup auth routes - no need to pass db connection
	auth.SetupRoutes(router)
	//tasks.SetupRoutes(router)
	recurringtasks.SetupRoutes(router) // Setup recurring tasks routes
	oneofftasks.SetupRoutes(router)
	ga.SetupRoutes(router)       // Setup GA routes
	calendar.SetupRoutes(router) // Setup calendar routes
	settings.SetupRoutes(router) // Setup settings routes
	// Start server
	router.Run() // listen and serve on 0.0.0.0:8080
}
