package calendar

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

// Calendar represents an event in the user's calendar
type Calendar struct {
	Description    *string   `json:"description"`
	Title          string    `json:"title"`           // <-- Uppercase 'T'
	ScheduledStart time.Time `json:"scheduled_start"` // <-- Uppercase 'S'
	ScheduledEnd   time.Time `json:"scheduled_end"`   // <-- Uppercase 'S'
}

// GetCalendarTasks retrieves all calendar events for a specific user
func GetCalendarTasks(c *gin.Context) {
	// Enhanced debugging
	log.Printf("[DEBUG] GetCalendarTasks: Request received from %s for %s %s",
		c.ClientIP(), c.Request.Method, c.Request.URL.Path)

	// Check for userID in context
	userIDInter, exists := c.Get("userID")
	if !exists {
		log.Printf("[DEBUG] GetCalendarTasks: userID not found in context. Auth has failed.")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User  not authenticated"})
		return
	}

	// Convert userID to an integer
	userID, ok := userIDInter.(int) // Assuming userID is int. Adjust if it's int64, uint, etc.
	if !ok {
		log.Printf("[DEBUG] GetCalendarTasks: userID is not an integer. Got: %T", userIDInter)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format in context"})
		return
	}

	log.Printf("[DEBUG] GetCalendarTasks: Authenticated userID: %v", userID)

	// SQL query to get calendar tasks, ordered by start time
	query := `
        SELECT 
            ti.description,
            ti.title,
            ti.scheduled_start_datetime AS scheduled_start,
            ti.scheduled_end_datetime AS scheduled_end
        FROM 
            "GAGeneration" gag
        JOIN 
            "TaskInstances" ti ON ti."GAGeneration_id" = gag."GAGeneration_id"
        JOIN
            "Calendars" c ON c."GAGeneration_id" = gag."GAGeneration_id"
        WHERE
            ti."user_id" = $1
    `

	// Get database connection
	database := db.GetDB()
	if database == nil {
		log.Printf("[ERROR] GetCalendarTasks: Failed to get database connection")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}

	// Execute the query
	rows, err := database.QueryContext(c.Request.Context(), query, userID) // Use QueryContext
	if err != nil {
		log.Printf("[ERROR] GetCalendarTasks: Query failed for user %d: %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query calendar tasks"})
		return
	}
	defer rows.Close()

	// Slice to hold the results
	var tasks []Calendar // Use the defined struct

	// Iterate over the result set
	for rows.Next() {
		var task Calendar // Create a new struct for each row
		var scheduledStart sql.NullTime
		var scheduledEnd sql.NullTime

		if err := rows.Scan(&task.Description, &task.Title, &scheduledStart, &scheduledEnd); err != nil {
			log.Printf("[ERROR] GetCalendarTasks: Failed to scan row for user %d: %v", userID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reading calendar tasks"})
			return
		}

		// Assign the scanned values to the task struct
		task.ScheduledStart = scheduledStart.Time
		task.ScheduledEnd = scheduledEnd.Time

		tasks = append(tasks, task) // Append the populated struct to the slice
	}

	// Check for errors that may have occurred during iteration (e.g., connection issues)
	if err = rows.Err(); err != nil {
		log.Printf("[ERROR] GetCalendarTasks: Rows iteration error for user %d: %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reading calendar tasks"})
		return
	}

	log.Printf("[DEBUG] GetCalendarTasks: Found %d tasks for user %d", len(tasks), userID)

	// Return the calendar tasks as a JSON response
	c.JSON(http.StatusOK, gin.H{
		"calendar_tasks": tasks, // Use the populated slice
	})
}

// SetupRoutes configures the API routes for calendar functionality
func SetupRoutes(router *gin.Engine) {
	// Create a calendar group with authentication middleware
	calendarGroup := router.Group("/calendar")
	calendarGroup.Use(auth.AuthMiddleware()) // Assuming you have an auth middleware

	// Calendar endpoints
	calendarGroup.GET("", GetCalendarTasks)
}
