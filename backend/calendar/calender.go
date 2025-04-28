package calendar

import (
	"database/sql"
	"fmt"
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

// Request structure for binding the JSON body
type AddCalendarRequest struct {
	generationId int    `json:"gaid" binding:"required,gt=0"`
	StartDate    string `json:"startDate" binding:"required"`
}

// AddScheduledCalendar handles adding a new calendar entry based on GA generation ID
func AddScheduledCalendar(c *gin.Context) {
	// Enhanced debugging: Log start and client IP
	log.Printf("[DEBUG] AddScheduledCalendar: Request received from %s", c.ClientIP())

	// 1. Get User ID from context (set by auth middleware)
	userIDInter, exists := c.Get("userID")
	if !exists {
		log.Printf("[DEBUG] AddScheduledCalendar: userID not found in context. Auth has failed.")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Type assert and validate the userID
	userID, ok := userIDInter.(int)
	if !ok || userID <= 0 {
		log.Printf("[DEBUG] AddScheduledCalendar: userID is not a valid integer or is non-positive. Got: %T, Value: %v", userIDInter, userIDInter)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}
	log.Printf("[DEBUG] AddScheduledCalendar: Processing request for userID: %d", userID)

	// 2. Bind JSON request body to the struct
	var req AddCalendarRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Log binding errors at DEBUG level as they are client-side issues
		log.Printf("[DEBUG] AddScheduledCalendar: Invalid JSON data for userID %d: %v", userID, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}
	log.Printf("[DEBUG] AddScheduledCalendar: Request data bound for userID %d - gaid: %d, startDate: %s", userID, req.GAID, req.StartDate)

	// 3. Validate StartDate format (ensure it's YYYY-MM-DD)
	// The "2006-01-02" is Go's specific layout string for YYYY-MM-DD parsing.
	_, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		// Log validation errors at DEBUG level as they are client-side input issues
		log.Printf("[DEBUG] AddScheduledCalendar: Invalid startDate format '%s' provided by userID %d: %v", req.StartDate, userID, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid startDate format. Please use YYYY-MM-DD."})
		return
	}
	log.Printf("[DEBUG] AddScheduledCalendar: StartDate format validated for userID %d.", userID)

	// 4. Prepare and execute the INSERT statement
	// Get database connection (assuming 'db' is accessible)
	database := db.GetDB()
	if database == nil {
		// Log database connection errors at ERROR level
		log.Printf("[ERROR] AddScheduledCalendar: Failed to get database connection for userID %d", userID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}

	ctx := c.Request.Context() // Use request context for potential cancellation
	query := `
		INSERT INTO "Calendars" ("user_id", "GAGeneration_id", "start_date")
		VALUES ($1, $2, $3)
	` // Using $ for PostgreSQL placeholders

	// Log the values being inserted for debugging
	log.Printf("[DEBUG] AddScheduledCalendar: Executing INSERT for userID: %d, GAGeneration_id: %d, start_date: %s",
		userID, req.GAID, req.StartDate)

	// Execute the query using the accessible 'db' connection
	result, err := database.ExecContext(ctx, query, userID, req.GAID, req.StartDate)
	if err != nil {
		// Log database execution errors at ERROR level
		log.Printf("[ERROR] AddScheduledCalendar: Failed to insert calendar entry for userID %d, gaid %d: %v", userID, req.GAID, err)

		// More detailed error message to help diagnose database-specific issues
		errMsg := fmt.Sprintf("Failed to save calendar entry: %v", err)

		c.JSON(http.StatusInternalServerError, gin.H{"error": errMsg})
		return
	}

	// 5. Optionally check rows affected and log appropriately
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		// Log inability to check rows affected as a warning, not a failure
		log.Printf("[WARN] AddScheduledCalendar: Could not verify rows affected after insert for userID %d, gaid %d: %v", userID, req.GAID, err)
	} else if rowsAffected == 0 {
		// Log 0 rows affected as a potential issue (could be constraint violation or already exists)
		log.Printf("[WARN] AddScheduledCalendar: INSERT statement affected 0 rows for userID %d, gaid %d. Check constraints or if entry already exists.", userID, req.GAID)
		// Depending on requirements, you might return an error here or a specific message
		// c.JSON(http.StatusConflict, gin.H{"error": "Calendar entry might already exist or constraints prevent insertion"})
		// return
	} else {
		log.Printf("[DEBUG] AddScheduledCalendar: Insert successful for userID %d, gaid %d. Rows affected: %d", userID, req.GAID, rowsAffected)
	}

	// 6. Return success response
	log.Printf("[DEBUG] AddScheduledCalendar: Successfully added calendar entry for userID %d.", userID)
	c.JSON(http.StatusCreated, gin.H{"message": "Calendar entry added successfully"})
}

// SetupRoutes configures the API routes for calendar functionality
func SetupRoutes(router *gin.Engine) {
	// Create a calendar group with authentication middleware
	calendarGroup := router.Group("/calendar")
	calendarGroup.Use(auth.AuthMiddleware()) // Assuming you have an auth middleware

	// Calendar endpoints
	calendarGroup.GET("", GetCalendarTasks)
	calendarGroup.POST("", AddScheduledCalendar) // Add a new endpoint for adding scheduled calendar tasks
}
