package settings

import (
	"database/sql"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	// Import auth package for authentication middleware

	"api/auth"
	"api/db"
)

// UserPreferences represents user preferences for scheduling
type UserPreferences struct {
	PreferenceID int       `json:"preference_id" db:"preference_id"`
	UserID       int       `json:"user_id" db:"user_id"`
	StartTime    time.Time `json:"start_time" db:"start_time"`
	EndTime      time.Time `json:"end_time" db:"end_time"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// UserPreferencesRequest represents the request body for user preferences
type UserPreferencesRequest struct {
	StartTime string `json:"start_time" binding:"required"`
	EndTime   string `json:"end_time" binding:"required"`
}

func GetUserPreferences(c *gin.Context) {
	// Enhanced debugging
	log.Printf("[DEBUG] GetUser Preferences: Request received from %s for %s %s",
		c.ClientIP(), c.Request.Method, c.Request.URL.Path)

	// Check for userID in context
	userIDInter, exists := c.Get("userID")
	if !exists {
		log.Printf("[DEBUG] GetUser Preferences: userID not found in context. Auth has failed.")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User  not authenticated"})
		return
	}

	// Convert userID to an integer
	userID, ok := userIDInter.(int) // Assuming userID is int. Adjust if it's int64, uint, etc.
	if !ok {
		log.Printf("[DEBUG] GetUser Preferences: userID is not an integer. Got: %T", userIDInter)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format in context"})
		return
	}

	log.Printf("[DEBUG] GetUser Preferences: Authenticated userID: %v", userID)

	// Get database connection
	database := db.GetDB()
	if database == nil {
		log.Printf("[ERROR] GetUser Preferences: Failed to get database connection")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}

	// SQL query to get user preferences
	query := `
		SELECT 
			start_time,
			end_time
		FROM 
			"UserPreferences"
		WHERE 
			user_id = $1`

	// Prepare variables to hold the results
	var startTime, endTime string // Adjust types as necessary

	// Execute the query
	err := database.QueryRow(query, userID).Scan(&startTime, &endTime)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "User  preferences not found"})
		} else {
			log.Printf("[ERROR] GetUser Preferences: Query failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user preferences"})
		}
		return
	}

	// Return the user preferences as JSON
	c.JSON(http.StatusOK, gin.H{
		"start_time": startTime,
		"end_time":   endTime,
	})
}

func UpdateUserPreferences(c *gin.Context) {
	// Enhanced debugging
	log.Printf("[DEBUG] UpdateUser Preferences: Request received from %s for %s %s",
		c.ClientIP(), c.Request.Method, c.Request.URL.Path)

	// Check for userID in context
	userIDInter, exists := c.Get("userID")
	if !exists {
		log.Printf("[DEBUG] UpdateUser Preferences: userID not found in context. Auth has failed.")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User  not authenticated"})
		return
	}

	// Convert userID to an integer
	userID, ok := userIDInter.(int) // Assuming userID is int. Adjust if it's int64, uint, etc.
	if !ok {
		log.Printf("[DEBUG] UpdateUser Preferences: userID is not an integer. Got: %T", userIDInter)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format in context"})
		return
	}

	log.Printf("[DEBUG] UpdateUser Preferences: Authenticated userID: %v", userID)

	// Get database connection
	database := db.GetDB()
	if database == nil {
		log.Printf("[ERROR] UpdateUser Preferences: Failed to get database connection")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}

	// Define a struct to hold the incoming preferences
	type Preferences struct {
		StartTime string `json:"start_time"`
		EndTime   string `json:"end_time"`
	}

	var prefs Preferences

	// Bind the JSON body to the preferences struct
	if err := c.ShouldBindJSON(&prefs); err != nil {
		log.Printf("[ERROR] UpdateUser Preferences: Failed to bind JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// SQL query to update user preferences
	query := `
		UPDATE "UserPreferences"
		SET start_time = $1, end_time = $2
		WHERE user_id = $3`

	// Execute the update query
	_, err := database.Exec(query, prefs.StartTime, prefs.EndTime, userID)
	if err != nil {
		log.Printf("[ERROR] UpdateUser Preferences: Update failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user preferences"})
		return
	}

	// Return success response
	c.JSON(http.StatusOK, gin.H{"message": "User  preferences updated successfully"})
}

func SetupRoutes(router *gin.Engine) {
	log.Printf("[DEBUG] Settings: Setting up settings routes...")

	// Create a route group for settings
	settingsRoutes := router.Group("/settings")
	settingsRoutes.Use(auth.AuthMiddleware()) // Using the auth middleware
	{
		log.Printf("[DEBUG] Settings: Configuring: GET /settings/preferences")
		settingsRoutes.GET("/preferences", GetUserPreferences) // Route to get user preferences

		log.Printf("[DEBUG] Settings: Configuring: PUT /settings/preferences")
		settingsRoutes.PUT("/preferences", UpdateUserPreferences) // Route to update user preferences
	}

	log.Printf("[DEBUG] Settings: Routes setup complete.")
}
