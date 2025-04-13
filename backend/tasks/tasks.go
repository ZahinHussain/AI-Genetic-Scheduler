package tasks

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"api/auth"
	"api/db"
)

// TaskStatus represents the status of a task
type TaskStatus string

const (
	StatusPending   TaskStatus = "pending"
	StatusCompleted TaskStatus = "completed"
	StatusCancelled TaskStatus = "cancelled"
	// Add other statuses as needed
)

// TaskType represents the type of a task
type TaskType string

const (
	TaskTypeOneOff    TaskType = "one_off"
	TaskTypeRecurring TaskType = "recurring"

	// Add other task types as needed
)

// Task represents a task in the system, aligned with the database schema
type Task struct {
	TaskID      int        `json:"task_id"`
	UserID      int        `json:"user_id"`
	CalendarID  *int       `json:"calendar_id"` // Optional field
	Title       string     `json:"title" binding:"required"`
	Description string     `json:"description"`
	TaskType    TaskType   `json:"task_type" binding:"required"`
	CategoryID  *int       `json:"category_id"` // Optional field
	Status      TaskStatus `json:"status"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   *time.Time `json:"updated_at"` // Optional field
}

type OneOffTask struct {
	TaskID          int       `json:"task_id"`
	Deadline        time.Time `json:"deadline"`
	DurationMinutes int       `json:"duration_minutes"`
}

// GetAllTasks retrieves all tasks for the authenticated user
func GetAllTasks(c *gin.Context) {
	// Enhanced debugging
	log.Printf("[DEBUG] GetAllTasks: Request received from %s for %s %s",
		c.ClientIP(), c.Request.Method, c.Request.URL.Path)

	// Log all context keys to debug what's available
	keys := c.Keys
	log.Printf("[DEBUG] GetAllTasks: Context keys: %v", keys)

	// Log authentication headers
	authHeader := c.GetHeader("Authorization")
	log.Printf("[DEBUG] GetAllTasks: Authorization header: %s", authHeader)

	// Check for userID in context - using key "userID" to match auth.go
	userIDInter, exists := c.Get("userID")
	if !exists {
		log.Printf("[DEBUG] GetAllTasks: userID not found in context. Auth has failed.")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Convert userID to an integer
	userID, ok := userIDInter.(int)
	if !ok {
		log.Printf("[DEBUG] GetAllTasks: userID is not an integer. Got: %T", userIDInter)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	log.Printf("[DEBUG] GetAllTasks: Authenticated userID: %v (type: %T)", userID, userID)

	// Prepare the SQL query.
	// Note: We're retrieving only one_off tasks.
	query := `
		SELECT "task_id", "user_id", "calendar_id", "category_id", "title",
		       "description", "task_type", "status", "created_at", "updated_at"
		FROM "Tasks"
		WHERE "user_id" = $1 AND "task_type" = 'one_off';
	`

	// Get database connection
	database := db.GetDB()
	if database == nil {
		log.Printf("[ERROR] GetAllTasks: Failed to get database connection")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}

	// Execute the query using the database connection
	rows, err := database.Query(query, userID)
	if err != nil {
		log.Printf("[ERROR] GetAllTasks: Query failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Query failed"})
		return
	}
	defer rows.Close()

	// Iterate over the result set.
	var tasks []Task
	for rows.Next() {
		var t Task
		var calendarID, categoryID sql.NullInt32
		var description sql.NullString
		var updatedAt sql.NullTime
		var taskTypeStr, statusStr string

		if err := rows.Scan(
			&t.TaskID,
			&t.UserID,
			&calendarID,
			&categoryID,
			&t.Title,
			&description,
			&taskTypeStr,
			&statusStr,
			&t.CreatedAt,
			&updatedAt); err != nil {
			log.Printf("[ERROR] GetAllTasks: Row scan failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve tasks"})
			return
		}

		// Handle nullable fields
		if calendarID.Valid {
			calID := int(calendarID.Int32)
			t.CalendarID = &calID
		}
		if categoryID.Valid {
			catID := int(categoryID.Int32)
			t.CategoryID = &catID
		}
		if description.Valid {
			t.Description = description.String
		}
		if updatedAt.Valid {
			t.UpdatedAt = &updatedAt.Time
		}

		// Convert string enums to typed enums
		t.TaskType = TaskType(taskTypeStr)
		t.Status = TaskStatus(statusStr)

		tasks = append(tasks, t)
	}

	// Check for errors after looping through rows.
	if err = rows.Err(); err != nil {
		log.Printf("[ERROR] GetAllTasks: Rows error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reading tasks"})
		return
	}

	// Return tasks along with some debug info.
	c.JSON(http.StatusOK, gin.H{
		"tasks": tasks,
		"debug": gin.H{
			"userID":     userID,
			"keys":       keys,
			"authHeader": authHeader,
		},
	})
}

// GetTask retrieves a specific task by ID
func GetTask(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	// Enhanced debugging
	log.Printf("[DEBUG] GetTask: Request received for task ID %d", taskID)

	// Get user ID from the authenticated user - using key "userID" to match auth.go
	userIDInter, exists := c.Get("userID")
	if !exists {
		log.Printf("[DEBUG] GetTask: userID not found in context. Auth has failed.")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, ok := userIDInter.(int)
	if !ok {
		log.Printf("[DEBUG] GetTask: userID is not an integer. Got: %T", userIDInter)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	log.Printf("[DEBUG] GetTask: Authenticated userID: %v for taskID: %d", userID, taskID)

	// Get database connection
	database := db.GetDB()
	if database == nil {
		log.Printf("[ERROR] GetTask: Failed to get database connection")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}

	// Prepare the SQL query
	query := `
		SELECT "task_id", "user_id", "calendar_id", "category_id", "title",
		       "description", "task_type", "status", "created_at", "updated_at"
		FROM "Tasks"
		WHERE "task_id" = $1
	`

	// Execute the query
	var task Task
	var calendarID, categoryID sql.NullInt32
	var description sql.NullString
	var updatedAt sql.NullTime
	var taskTypeStr, statusStr string

	err = database.QueryRow(query, taskID).Scan(
		&task.TaskID,
		&task.UserID,
		&calendarID,
		&categoryID,
		&task.Title,
		&description,
		&taskTypeStr,
		&statusStr,
		&task.CreatedAt,
		&updatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("[DEBUG] GetTask: No task found with ID %d", taskID)
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}
		log.Printf("[ERROR] GetTask: Database query error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve task"})
		return
	}

	// Handle nullable fields
	if calendarID.Valid {
		calID := int(calendarID.Int32)
		task.CalendarID = &calID
	}
	if categoryID.Valid {
		catID := int(categoryID.Int32)
		task.CategoryID = &catID
	}
	if description.Valid {
		task.Description = description.String
	}
	if updatedAt.Valid {
		task.UpdatedAt = &updatedAt.Time
	}

	// Convert string enums to typed enums
	task.TaskType = TaskType(taskTypeStr)
	task.Status = TaskStatus(statusStr)

	// Verify that the task belongs to the authenticated user
	if task.UserID != userID {
		log.Printf("[WARN] GetTask: User %v attempted to access task %d belonging to user %d", userID, taskID, task.UserID)
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to access this task"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"task": task})
}

// CreateTask creates a new task
func CreateTask(c *gin.Context) {
	// Enhanced debugging
	log.Printf("[DEBUG] CreateTask: Request received from %s", c.ClientIP())

	var taskRequest struct {
		Task       Task        `json:"task"`
		OneOffTask *OneOffTask `json:"oneOffTask,omitempty"` // Using pointer to allow nil check
	}

	if err := c.ShouldBindJSON(&taskRequest); err != nil {
		log.Printf("[DEBUG] CreateTask: Invalid JSON data: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from the authenticated user - using key "userID" to match auth.go
	userID, exists := c.Get("userID")
	if !exists {
		log.Printf("[DEBUG] CreateTask: userID not found in context. Auth has failed.")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	log.Printf("[DEBUG] CreateTask: Creating task for userID: %v", userID)

	// Set the user ID on the task
	taskRequest.Task.UserID = userID.(int)

	// Set default values
	taskRequest.Task.CreatedAt = time.Now()
	if taskRequest.Task.Status == "" {
		taskRequest.Task.Status = StatusPending
	}

	// Get database connection
	database := db.GetDB()
	if database == nil {
		log.Printf("[ERROR] CreateTask: Failed to get database connection")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}

	// Begin transaction
	tx, err := database.Begin()
	if err != nil {
		log.Printf("[ERROR] CreateTask: Failed to begin transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start database transaction"})
		return
	}
	defer tx.Rollback() // Rollback transaction if not committed

	var taskID int

	// Insert the base task
	taskInsertQuery := `
		INSERT INTO "Tasks" (
			"user_id",
			"calendar_id",
			"category_id",
			"title",
			"description",
			"task_type",
			"status",
			"created_at"
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING "task_id"
	`

	err = tx.QueryRow(
		taskInsertQuery,
		taskRequest.Task.UserID,
		taskRequest.Task.CalendarID,
		taskRequest.Task.CategoryID,
		taskRequest.Task.Title,
		taskRequest.Task.Description,
		taskRequest.Task.TaskType,
		taskRequest.Task.Status,
		taskRequest.Task.CreatedAt,
	).Scan(&taskID)

	if err != nil {
		log.Printf("[ERROR] CreateTask: Failed to insert task: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task"})
		return
	}

	// Handle specific task types
	if taskRequest.Task.TaskType == TaskTypeOneOff && taskRequest.OneOffTask != nil {
		oneOffInsertQuery := `
			INSERT INTO "OneOffTasks" (
				"task_id",
				"deadline",
				"duration_minutes"
			)
			VALUES ($1, $2, $3)
		`

		_, err = tx.Exec(
			oneOffInsertQuery,
			taskID,
			taskRequest.OneOffTask.Deadline,
			taskRequest.OneOffTask.DurationMinutes,
		)

		if err != nil {
			log.Printf("[ERROR] CreateTask: Failed to insert one-off task details: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create one-off task details"})
			return
		}
	}

	// Commit the transaction
	if err = tx.Commit(); err != nil {
		log.Printf("[ERROR] CreateTask: Failed to commit transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save task to database"})
		return
	}

	// Set the task ID for the response
	taskRequest.Task.TaskID = taskID

	log.Printf("[DEBUG] CreateTask: Successfully created task with ID %d", taskID)
	c.JSON(http.StatusCreated, gin.H{"task": taskRequest.Task})
}

// UpdateTask updates an existing task

/*
func UpdateTask(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	// Enhanced debugging
	log.Printf("[DEBUG] UpdateTask: Request received for task ID %d", taskID)

	// Get user ID from the authenticated user - using key "userID" to match auth.go
	userID, exists := c.Get("userID")
	if !exists {
		log.Printf("[DEBUG] UpdateTask: userID not found in context. Auth has failed.")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	log.Printf("[DEBUG] UpdateTask: Updating task %d for userID: %v", taskID, userID)

	// Get database connection
	database := db.GetDB()
	if database == nil {
		log.Printf("[ERROR] UpdateTask: Failed to get database connection")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}

	// First fetch the existing task to ensure it exists and belongs to the user
	var existingTask Task
	var calendarIDNull, categoryIDNull sql.NullInt64
	var updatedAtNull sql.NullTime

	fetchQuery := "SELECT * FROM \"Tasks\" WHERE \"task_id\" = $1"
	err = database.QueryRow(fetchQuery, taskID).Scan(
		&existingTask.TaskID,
		&existingTask.UserID,
		&calendarIDNull, // Using NullInt64 to handle NULL values
		&categoryIDNull, // Using NullInt64 to handle NULL values
		&existingTask.Title,
		&existingTask.Description,
		&existingTask.TaskType,
		&existingTask.Status,
		&existingTask.CreatedAt,
		&updatedAtNull, // Using NullTime to handle NULL values
		// Add any other fields in your Task struct that need to be populated
	)

	// Convert the NULL-able values to pointers
	if calendarIDNull.Valid {
		calID := int(calendarIDNull.Int64)
		existingTask.CalendarID = &calID
	}

	if categoryIDNull.Valid {
		catID := int(categoryIDNull.Int64)
		existingTask.CategoryID = &catID
	}

	if updatedAtNull.Valid {
		existingTask.UpdatedAt = &updatedAtNull.Time
	}

	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("[DEBUG] UpdateTask: No task found with ID %d", taskID)
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		} else {
			log.Printf("[ERROR] UpdateTask: Database query error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve task"})
		}
		return
	}

	// Check if the task belongs to the authenticated user
	if existingTask.UserID != userID.(int) {
		log.Printf("[WARN] UpdateTask: User %v attempted to update task %d belonging to user %d", userID, taskID, existingTask.UserID)
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to update this task"})
		return
	}

	// Parse request body into a map to identify which fields are being updated
	var requestData map[string]interface{}
	if err := c.ShouldBindJSON(&requestData); err != nil {
		log.Printf("[DEBUG] UpdateTask: Invalid JSON data: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update the task struct with request data
	// This preserves existing values for fields not included in the request
	updated := false

	if title, ok := requestData["title"].(string); ok && title != "" {
		existingTask.Title = title
		updated = true
	}

	if description, ok := requestData["description"].(string); ok {
		existingTask.Description = description
		updated = true
	}

	if taskTypeVal, ok := requestData["task_type"]; ok {
		if taskType, ok := taskTypeVal.(string); ok && taskType != "" {
			switch taskType {
			case TaskTypeOneOff, TaskTypeRecurring, TaskTypeFlexible:
				existingTask.TaskType = taskType
				updated = true
			default:
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task_type"})
				return
			}
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "task_type must be a non-empty string"})
			return
		}
	}

	if statusVal, ok := requestData["status"]; ok {
		if status, ok := statusVal.(string); ok && status != "" {
			switch status {
			case StatusPending, StatusInProgress, StatusCompleted, StatusCancelled:
				existingTask.Status = status
				updated = true
			default:
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
				return
			}
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "status must be a non-empty string"})
			return
		}
	}
	// Handle calendar_id - including explicit null
	if calendarIDVal, ok := requestData["calendar_id"]; ok {
		if calendarIDVal == nil {
			existingTask.CalendarID = nil // Set to nil if explicitly provided as null
		} else if calendarID, ok := calendarIDVal.(float64); ok {
			calID := int(calendarID)
			existingTask.CalendarID = &calID
		}
		updated = true
	}

	// Handle category_id - including explicit null
	if categoryIDVal, ok := requestData["category_id"]; ok {
		if categoryIDVal == nil {
			existingTask.CategoryID = nil // Set to nil if explicitly provided as null
		} else if categoryID, ok := categoryIDVal.(float64); ok {
			catID := int(categoryID)
			existingTask.CategoryID = &catID
		}
		updated = true
	}

	// Add handlers for other fields as needed

	if !updated {
		log.Printf("[DEBUG] UpdateTask: No valid fields to update for task %d", taskID)
		c.JSON(http.StatusBadRequest, gin.H{"error": "No valid fields to update"})
		return
	}

	// Set the updated time
	now := time.Now()
	existingTask.UpdatedAt = &now

	// Create NullInt64 values for nullable fields to use in the query
	var calendarIDParam, categoryIDParam sql.NullInt64

	if existingTask.CalendarID != nil {
		calendarIDParam.Int64 = int64(*existingTask.CalendarID)
		calendarIDParam.Valid = true
	}

	if existingTask.CategoryID != nil {
		categoryIDParam.Int64 = int64(*existingTask.CategoryID)
		categoryIDParam.Valid = true
	}

	// Perform the update
	updateQuery := `
		UPDATE "Tasks"
		SET
			"title" = $1,
			"description" = $2,
			"task_type" = $3,
			"status" = $4,
			"calendar_id" = $5,
			"category_id" = $6,
			"updated_at" = $7
		WHERE "task_id" = $8 AND "user_id" = $9
	`

	result, err := database.Exec(
		updateQuery,
		existingTask.Title,
		existingTask.Description,
		existingTask.TaskType,
		existingTask.Status,
		calendarIDParam,        // Using NullInt64 to handle NULL values
		categoryIDParam,        // Using NullInt64 to handle NULL values
		existingTask.UpdatedAt, // This is already a pointer
		taskID,
		userID.(int),
	)

	if err != nil {
		log.Printf("[ERROR] UpdateTask: Failed to update task: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task"})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("[ERROR] UpdateTask: Failed to get rows affected: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to confirm task update"})
		return
	}

	if rowsAffected == 0 {
		log.Printf("[WARN] UpdateTask: No rows affected when updating task %d", taskID)
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found or no changes made"})
		return
	}

	log.Printf("[DEBUG] UpdateTask: Successfully updated task with ID %d", taskID)
	c.JSON(http.StatusOK, gin.H{"task": existingTask})
}

// Helper function to create an integer pointer

// Helper function to create an integer pointer
func intPtr(i int) *int {
	return &i
}

*/
// DeleteTask deletes a task
func DeleteTask(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	// Enhanced debugging
	log.Printf("[DEBUG] DeleteTask: Request received for task ID %d", taskID)

	// Get user ID from the authenticated user - using key "userID" to match auth.go
	userID, exists := c.Get("userID")
	if !exists {
		log.Printf("[DEBUG] DeleteTask: userID not found in context. Auth has failed.")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	log.Printf("[DEBUG] DeleteTask: Deleting task %d for userID: %v", taskID, userID)

	// Get database connection
	database := db.GetDB()
	if database == nil {
		log.Printf("[ERROR] DeleteTask: Failed to get database connection")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}

	// Begin transaction
	tx, err := database.Begin()
	if err != nil {
		log.Printf("[ERROR] DeleteTask: Failed to begin transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start database transaction"})
		return
	}
	defer tx.Rollback() // Rollback transaction if not committed

	// First verify that the task exists and belongs to the user
	var existingUserID int
	err = tx.QueryRow("SELECT user_id FROM \"Tasks\" WHERE task_id = $1", taskID).Scan(&existingUserID)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("[DEBUG] DeleteTask: No task found with ID %d", taskID)
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		} else {
			log.Printf("[ERROR] DeleteTask: Database query error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve task"})
		}
		return
	}

	// Check if the task belongs to the authenticated user
	if existingUserID != userID.(int) {
		log.Printf("[WARN] DeleteTask: User %v attempted to delete task %d belonging to user %d", userID, taskID, existingUserID)
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to delete this task"})
		return
	}

	// Delete from specific task type tables first (e.g., OneOffTasks, RecurringTasks)
	// This is necessary because of foreign key constraints

	// Delete from OneOffTasks if it exists there
	_, err = tx.Exec("DELETE FROM \"OneOffTasks\" WHERE task_id = $1", taskID)
	if err != nil {
		log.Printf("[ERROR] DeleteTask: Failed to delete from OneOffTasks: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task details"})
		return
	}

	// Add similar statements for other task type tables as needed
	// For example:
	// _, err = tx.Exec("DELETE FROM \"RecurringTasks\" WHERE task_id = $1", taskID)
	// if err != nil { ... }

	// Finally delete from the main Tasks table
	result, err := tx.Exec("DELETE FROM \"Tasks\" WHERE task_id = $1 AND user_id = $2", taskID, userID.(int))
	if err != nil {
		log.Printf("[ERROR] DeleteTask: Failed to delete task: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task"})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("[ERROR] DeleteTask: Failed to get rows affected: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to confirm task deletion"})
		return
	}

	if rowsAffected == 0 {
		log.Printf("[WARN] DeleteTask: No rows affected when deleting task %d", taskID)
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	// Commit the transaction
	if err = tx.Commit(); err != nil {
		log.Printf("[ERROR] DeleteTask: Failed to commit transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task from database"})
		return
	}

	log.Printf("[DEBUG] DeleteTask: Successfully deleted task with ID %d", taskID)
	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}

// SetupRoutes configures the routes for tasks
func SetupRoutes(router *gin.Engine) {
	log.Printf("[DEBUG] Tasks: Setting up /tasks routes...")

	// All task routes should be protected by authentication
	taskRoutes := router.Group("/tasks")
	taskRoutes.Use(auth.AuthMiddleware()) // Using the correct auth middleware import
	{
		log.Printf("[DEBUG] Tasks: Configuring: GET /tasks")
		taskRoutes.GET("", GetAllTasks)

		log.Printf("[DEBUG] Tasks: Configuring: GET /tasks/:id")
		taskRoutes.GET("/:id", GetTask)

		log.Printf("[DEBUG] Tasks: Configuring: POST /tasks")
		taskRoutes.POST("", CreateTask)

		//log.Printf("[DEBUG] Tasks: Configuring: PUT /tasks/:id")
		//	taskRoutes.PUT("/:id", UpdateTask)

		log.Printf("[DEBUG] Tasks: Configuring: DELETE /tasks/:id")
		taskRoutes.DELETE("/:id", DeleteTask)
	}

	log.Printf("[DEBUG] Tasks: Routes setup complete.")
}
