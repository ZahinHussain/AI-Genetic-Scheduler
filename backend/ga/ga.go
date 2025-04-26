package ga

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"api/auth" // Import auth package for authentication middleware
	"api/db"

	// Database connection
	"api/ga/runga"
)

type TaskSubType string

const (
	TaskSubTypeOneOff    TaskSubType = "one_off"
	TaskSubTypeRecurring TaskSubType = "recurring"
)

// ScheduledTask represents a task with scheduling information from GA algorithm
type ScheduledTask struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	StartDate   time.Time `json:"startDate"`
	EndDate     time.Time `json:"endDate"`
	TaskType    string    `json:"taskType"`
	Description string    `json:"description"`
}

// TaskInstance represents a scheduled instance of a task in the database
type TaskInstance struct {
	InstanceID             int         `json:"instance_id"`
	UserID                 int         `json:"user_id"`
	GAGenerationID         int         `json:"ga_generation_id"`
	TaskSourceID           int         `json:"task_source_id"`
	TaskSourceType         TaskSubType `json:"task_source_type"`
	ScheduledStartDatetime time.Time   `json:"scheduled_start_datetime"`
	ScheduledEndDatetime   time.Time   `json:"scheduled_end_datetime"`
	Title                  string      `json:"title"`
	Description            string      `json:"description"`
	CreatedAt              time.Time   `json:"created_at"`
	UpdatedAt              *time.Time  `json:"updated_at"`
}

// TaskRequest represents the JSON structure for the GA route request

// RunGA handles the request to run the genetic algorithm with the provided tasks
func RunGA(c *gin.Context) {
	// Log the beginning of the RunGA function
	log.Printf("[INFO] RunGA: Starting GA request processing")

	// Get user ID from context (set by auth middleware)
	userIDInter, exists := c.Get("userID")
	if !exists {
		log.Printf("[ERROR] RunGA: User not authenticated")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, ok := userIDInter.(int)
	if !ok {
		log.Printf("[ERROR] RunGA: Invalid user ID")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}
	log.Printf("[INFO] RunGA: Processing request for user ID: %d", userID)

	// Bind JSON request to the struct
	var request struct {
		Recurring []int `json:"recurring_task_ids"`
		OneOff    []int `json:"one_off_task_ids"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		log.Printf("[ERROR] RunGA: Invalid request format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Log the request data
	log.Printf("[INFO] RunGA: Received request with %d recurring tasks and %d one-off tasks",
		len(request.Recurring), len(request.OneOff))

	// Call the GenerateSchedule function directly with the user ID and task IDs

	jsonResponse := runga.GenerateSchedule(userID, request.Recurring, request.OneOff)

	gaGenerationID, err := createGAGenerationRecord(userID)
	if err != nil {
		log.Printf("[ERROR] RunGA: Failed to create GA generation record: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create GA generation record"})
		return
	}

	SaveTaskInstances(userID, gaGenerationID, jsonResponse)
	if err != nil {
		log.Printf("[ERROR] RunGA: Failed to create GA tasks: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create GA tasks"})
		return
	}

	// Return the JSON response directly
	c.Data(http.StatusOK, "application/json", jsonResponse)
}

// SaveTaskInstances saves the task instances from a GA generation
func SaveTaskInstances(userID int, gaGenerationID int, jsonData []byte) error {
	log.Printf("[INFO] SaveTaskInstances: Called for user %d, generation %d. JSON data size: %d bytes.",
		userID, gaGenerationID, len(jsonData))

	// Parse the JSON data
	var scheduledTasks []ScheduledTask
	log.Printf("[INFO] SaveTaskInstances: Attempting to parse JSON data for user %d.", userID)
	if err := json.Unmarshal(jsonData, &scheduledTasks); err != nil {
		log.Printf("[ERROR] SaveTaskInstances: Failed to parse JSON data for user %d: %v", userID, err)
		return fmt.Errorf("failed to parse task data for user %d: %w", userID, err) // Use %w for error wrapping if using Go 1.13+
	}

	if len(scheduledTasks) == 0 {
		log.Printf("[INFO] SaveTaskInstances: No tasks found in JSON data for user %d, generation %d. Nothing to save.", userID, gaGenerationID)
		return nil // Nothing to do, not an error
	}

	log.Printf("[INFO] SaveTaskInstances: Parsed %d tasks for user %d, generation %d. Proceeding to save.",
		len(scheduledTasks), userID, gaGenerationID)

	// Get database connection
	log.Printf("[INFO] SaveTaskInstances: Getting database connection.")
	database := db.GetDB() // Assuming db.GetDB() returns *sql.DB
	if database == nil {
		log.Printf("[ERROR] SaveTaskInstances: Failed to get database connection.")
		return fmt.Errorf("database connection is nil")
	}

	// Begin transaction
	log.Printf("[INFO] SaveTaskInstances: Beginning database transaction for user %d, generation %d.", userID, gaGenerationID)
	tx, err := database.Begin()
	if err != nil {
		log.Printf("[ERROR] SaveTaskInstances: Failed to begin transaction for user %d: %v", userID, err)
		return fmt.Errorf("failed to begin transaction for user %d: %w", userID, err)
	}
	// Defer rollback in case of errors - MUST come after error check for Begin()
	defer func() {
		if err := tx.Rollback(); err != nil && err != sql.ErrTxDone {
			// Log rollback errors unless it's because the transaction was already committed/rolled back
			log.Printf("[ERROR] SaveTaskInstances: Failed to rollback transaction for user %d: %v", userID, err)
		}
	}()

	// Prepare insert statement
	log.Printf("[INFO] SaveTaskInstances: Preparing insert statement for TaskInstances.")
	stmt, err := tx.Prepare(`
		INSERT INTO "TaskInstances" (
			"user_id",
			"GAGeneration_id",
			"task_source_id",
			"task_source_type",
			"scheduled_start_datetime",
			"scheduled_end_datetime",
			"title",
			"description",
			"created_at"
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`)
	if err != nil {
		log.Printf("[ERROR] SaveTaskInstances: Failed to prepare statement for user %d: %v", userID, err)
		// Rollback will be handled by defer
		return fmt.Errorf("failed to prepare insert statement for user %d: %w", userID, err)
	}
	// Defer closing the statement - MUST come after error check for Prepare()
	defer stmt.Close()

	// Insert each task instance
	now := time.Now() // Use a single timestamp for all inserts in this batch
	log.Printf("[INFO] SaveTaskInstances: Starting batch insert for %d tasks (user %d, generation %d).", len(scheduledTasks), userID, gaGenerationID)
	for i, task := range scheduledTasks {
		// Determine task source type
		var taskSourceType TaskSubType
		switch task.TaskType {
		case "one_off":
			taskSourceType = TaskSubTypeOneOff
		case "recurring":
			taskSourceType = TaskSubTypeRecurring
		default:
			log.Printf("[WARN] SaveTaskInstances: User %d, Generation %d: Unknown task type '%s' for source task ID %d. Defaulting to '%s'.",
				userID, gaGenerationID, task.TaskType, task.ID, TaskSubTypeOneOff)
			taskSourceType = TaskSubTypeOneOff
		}

		log.Printf("[DEBUG] SaveTaskInstances: Inserting task %d/%d: SourceID=%d, Type=%s, Title='%s' for user %d.",
			i+1, len(scheduledTasks), task.ID, taskSourceType, task.Title, userID) // DEBUG level might be better here if you have levelled logging

		// Execute insert
		_, err := stmt.Exec(
			userID,
			gaGenerationID,
			task.ID,
			string(taskSourceType), // Convert enum/type to string for DB
			task.StartDate,
			task.EndDate,
			task.Title,
			task.Description,
			now, // Consistent created_at for the batch
		)
		if err != nil {
			// Specific error handling could go here (e.g., check for constraint violations)
			log.Printf("[ERROR] SaveTaskInstances: Failed to insert task instance %d/%d (SourceID: %d, Title: '%s') for user %d: %v. Rolling back transaction.",
				i+1, len(scheduledTasks), task.ID, task.Title, userID, err)
			// Rollback will be handled by defer
			return fmt.Errorf("failed to insert task instance (user %d, source task %d): %w", userID, task.ID, err)
		}
	}

	// Commit transaction
	log.Printf("[INFO] SaveTaskInstances: Attempting to commit transaction for user %d, generation %d after inserting %d tasks.",
		userID, gaGenerationID, len(scheduledTasks))
	if err := tx.Commit(); err != nil {
		log.Printf("[ERROR] SaveTaskInstances: Failed to commit transaction for user %d: %v", userID, err)
		// Rollback should be implicitly handled by defer here as Commit failed.
		return fmt.Errorf("failed to commit transaction for user %d: %w", userID, err)
	}

	log.Printf("[INFO] SaveTaskInstances: Successfully saved %d task instances for user %d, generation %d.",
		len(scheduledTasks), userID, gaGenerationID)
	return nil // Success!
}

func createGAGenerationRecord(userID int) (int, error) {
	database := db.GetDB()
	if database == nil {
		return 0, fmt.Errorf("database connection error")
	}

	var gaGenerationID int
	err := database.QueryRow(
		`INSERT INTO "GAGeneration" ("user_id", "calendar_id", "created_at") 
         VALUES ($1, NULL, $2) 
         RETURNING "GAGeneration_id"`,
		userID, time.Now(),
	).Scan(&gaGenerationID)

	if err != nil {
		return 0, err
	}

	return gaGenerationID, nil
}

// SetupRoutes configures the GA routes
func SetupRoutes(router *gin.Engine) {
	log.Printf("[DEBUG] GA: Setting up GA routes with authentication...")

	// Creating a route group for /ga with authentication middleware
	gaGroup := router.Group("/ga")
	gaGroup.Use(auth.AuthMiddleware()) // Apply auth middleware to all GA routes
	{
		log.Printf("[DEBUG] GA: Configuring: POST /ga")
		gaGroup.POST("/", RunGA)

		// Add any other GA routes here
	}

	log.Printf("[DEBUG] GA: Routes setup complete.")
}
