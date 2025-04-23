package oneofftasks

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
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

type Constraint string

const (
	Hard Constraint = "hard"
	Soft Constraint = "soft"
	// Add other task types as needed
)

// Task represents a task in the system, aligned with the database schema
type Task struct {
	TaskID      int        `json:"task_id"`
	UserID      int        `json:"user_id"`
	CalendarID  *int       `json:"calendar_id"` // Optional field
	Title       string     `json:"title" binding:"required"`
	Description string     `json:"description"`
	Constraint  Constraint `json:"constraint" binding:"required"`
	CategoryID  *int       `json:"category_id"` // Optional field
	Status      TaskStatus `json:"status"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   *time.Time `json:"updated_at"` // Optional field
}

// OneOffTask represents a one-off task with its specific fields
// Aligned with the database schema:
// CREATE TABLE "OneOffTasks" (
//
//	"one_off_task_id" INTEGER [pk, increment]
//	"user_id" integer [not null]
//	"deadline" timestamp [note: 'When the task must be completed by']
//	"duration_minutes" integer [note: 'Estimated time needed to complete the task, optional']
//	"category_id" integer
//	"title" varchar(255) [not null]
//	"description" text
//	"created_at" timestamp [not null, default: `now()`]
//	"updated_at" timestamp [default: `now()`]
//
// );
type OneOffTask struct {
	OneOffTaskID    int        `json:"one_off_task_id"`
	UserID          int        `json:"user_id"`
	Deadline        *time.Time `json:"deadline"`
	DurationMinutes int        `json:"duration_minutes"` // Optional, but useful for scheduling
	CategoryID      *int       `json:"category_id"`      // Optional field
	Constraint      string     `json:"constraint"`
	Title           string     `json:"title" binding:"required"`
	Description     string     `json:"description"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       *time.Time `json:"updated_at"` // Optional field
}

// GetOneOffTasks retrieves all one-off tasks for the authenticated user
func GetOneOffTasks(c *gin.Context) {
	// Enhanced debugging
	log.Printf("[DEBUG] GetOneOffTasks: Request received from %s for %s %s",
		c.ClientIP(), c.Request.Method, c.Request.URL.Path)

	// Check for userID in context
	userIDInter, exists := c.Get("userID")
	if !exists {
		log.Printf("[DEBUG] GetOneOffTasks: userID not found in context. Auth has failed.")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Convert userID to an integer
	userID, ok := userIDInter.(int)
	if !ok {
		log.Printf("[DEBUG] GetOneOffTasks: userID is not an integer. Got: %T", userIDInter)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	log.Printf("[DEBUG] GetOneOffTasks: Authenticated userID: %v", userID)

	// Prepare the SQL query
	query := `
		SELECT "one_off_task_id", "user_id", "deadline", "duration_minutes", 
		       "category_id","constraint", "title", "description", "created_at", "updated_at"
		FROM "OneOffTasks"
		WHERE "user_id" = $1;
	`

	// Get database connection
	database := db.GetDB()
	if database == nil {
		log.Printf("[ERROR] GetOneOffTasks: Failed to get database connection")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}

	// Execute the query
	rows, err := database.Query(query, userID)
	if err != nil {
		log.Printf("[ERROR] GetOneOffTasks: Query failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Query failed"})
		return
	}
	defer rows.Close()

	// Iterate over the result set
	var tasks []OneOffTask
	for rows.Next() {
		var t OneOffTask
		var categoryID sql.NullInt32
		var description sql.NullString
		var updatedAt sql.NullTime
		var durationMinutes sql.NullInt32
		var constraint sql.NullString

		if err := rows.Scan(
			&t.OneOffTaskID,
			&t.UserID,
			&t.Deadline,
			&durationMinutes,
			&categoryID,
			&constraint,
			&t.Title,
			&description,
			&t.CreatedAt,
			&updatedAt); err != nil {
			log.Printf("[ERROR] GetOneOffTasks: Row scan failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve tasks"})
			return
		}

		// Handle nullable fields
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
		if durationMinutes.Valid {
			t.DurationMinutes = int(durationMinutes.Int32)
		}

		if constraint.Valid && constraint.String != "" {
			// Check if it's a valid constraint value
			switch Constraint(constraint.String) {
			case Hard, Soft:
				t.Constraint = constraint.String
			default:
				// Invalid constraint value, use default
				t.Constraint = string(Soft)
			}
		} else {
			// NULL or empty constraint, use default
			t.Constraint = string(Soft)
		}

		tasks = append(tasks, t)
	}

	// Check for errors after looping through rows
	if err = rows.Err(); err != nil {
		log.Printf("[ERROR] GetOneOffTasks: Rows error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reading tasks"})
		return
	}

	// Return tasks
	c.JSON(http.StatusOK, gin.H{
		"one_off_tasks": tasks,
	})
}

// GetOneOffTask retrieves a single one-off task by ID
func GetOneOffTask(c *gin.Context) {
	// Get the authenticated user ID
	userIDInter, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, ok := userIDInter.(int)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get task ID from URL parameter
	taskIDStr := c.Param("taskID")
	taskID, err := strconv.Atoi(taskIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	// Get database connection
	database := db.GetDB()
	if database == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}

	// Prepare the SQL query
	query := `
	SELECT "one_off_task_id", "user_id", "deadline", "duration_minutes", 
	       "category_id", "constraint", "title", "description", "created_at", "updated_at"
	FROM "OneOffTasks"
	WHERE "one_off_task_id" = $1 AND "user_id" = $2;
	`

	var t OneOffTask
	var categoryID sql.NullInt32
	var description sql.NullString
	var updatedAt sql.NullTime
	var durationMinutes sql.NullInt32
	var constraint sql.NullString

	err = database.QueryRow(query, taskID, userID).Scan(
		&t.OneOffTaskID,
		&t.UserID,
		&t.Deadline,
		&durationMinutes,
		&categoryID,
		&constraint, // Added missing constraint field scan
		&t.Title,
		&description,
		&t.CreatedAt,
		&updatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "One-off task not found"})
		} else {
			log.Printf("[ERROR] GetOneOffTask: Query failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve task"})
		}
		return
	}

	// Handle nullable fields
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
	if durationMinutes.Valid {
		t.DurationMinutes = int(durationMinutes.Int32)
	}

	// Handle constraint value - use your custom type
	if constraint.Valid && constraint.String != "" {
		// Check if it's a valid constraint value
		switch Constraint(constraint.String) {
		case Hard, Soft:
			t.Constraint = constraint.String
		default:
			// Invalid constraint value, use default
			t.Constraint = string(Soft)
		}
	} else {
		// NULL or empty constraint, use default
		t.Constraint = string(Soft)
	}

	c.JSON(http.StatusOK, gin.H{
		"one_off_task": t,
	})
}

// CreateOneOffTask creates a new one-off task
func CreateOneOffTask(c *gin.Context) {
	// Enhanced debugging
	log.Printf("[DEBUG] CreateOneOffTask: Request received from %s", c.ClientIP())

	// Get the authenticated user ID
	userIDInter, exists := c.Get("userID")
	if !exists {
		log.Printf("[DEBUG] CreateOneOffTask: userID not found in context. Auth has failed.")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, ok := userIDInter.(int)
	if !ok {
		log.Printf("[DEBUG] CreateOneOffTask: userID is not an integer. Got: %T", userIDInter)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	log.Printf("[DEBUG] CreateOneOffTask: Creating one-off task for userID: %v", userID)

	// Get raw data first to check the deadline value
	var rawData map[string]interface{}
	if err := c.ShouldBindJSON(&rawData); err != nil {
		log.Printf("[DEBUG] CreateOneOffTask: Invalid JSON data: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create a task with defaults
	taskRequest := OneOffTask{
		UserID:    userID,
		CreatedAt: time.Now(),
	}
	now := time.Now()
	taskRequest.UpdatedAt = &now

	// Process fields from raw data
	// Check for deadline - special handling for NULL string
	if deadline, exists := rawData["deadline"]; exists {
		if deadline == nil {
			taskRequest.Deadline = nil
		} else if deadlineStr, ok := deadline.(string); ok {
			if strings.EqualFold(deadlineStr, "null") || deadlineStr == "" {
				taskRequest.Deadline = nil
			} else {
				parsedTime, err := time.Parse(time.RFC3339, deadlineStr)
				if err != nil {
					log.Printf("[DEBUG] CreateOneOffTask: Invalid deadline format: %v - setting to null", err)
					taskRequest.Deadline = nil
				} else {
					taskRequest.Deadline = &parsedTime
				}
			}
		}
	}

	// Process title
	if title, exists := rawData["title"]; exists && title != nil {
		if titleStr, ok := title.(string); ok && titleStr != "" {
			taskRequest.Title = titleStr
		}
	}

	// Process description
	if description, exists := rawData["description"]; exists && description != nil {
		if descStr, ok := description.(string); ok {
			taskRequest.Description = descStr
		}
	}

	// Process duration_minutes
	if duration, exists := rawData["duration_minutes"]; exists && duration != nil {
		if durationFloat, ok := duration.(float64); ok {
			taskRequest.DurationMinutes = int(durationFloat)
		}
	}

	// Process category_id
	if categoryID, exists := rawData["category_id"]; exists {
		if categoryID == nil {
			taskRequest.CategoryID = nil
		} else if categoryFloat, ok := categoryID.(float64); ok && categoryFloat > 0 {
			catID := int(categoryFloat)
			taskRequest.CategoryID = &catID
		}
	}

	// Process constraint
	if constraint, exists := rawData["constraint"]; exists && constraint != nil {
		if constraintStr, ok := constraint.(string); ok && constraintStr != "" {
			taskRequest.Constraint = constraintStr
		} else {
			taskRequest.Constraint = "hard" // Default
		}
	} else {
		taskRequest.Constraint = "hard" // Default
	}

	// Validate title
	if taskRequest.Title == "" {
		taskRequest.Title = "Untitled Task" // Provide default title
	}

	// Get database connection
	database := db.GetDB()
	if database == nil {
		log.Printf("[ERROR] CreateOneOffTask: Failed to get database connection")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}

	// Insert the one-off task
	insertQuery := `
		INSERT INTO "OneOffTasks" (
			"user_id",
			"deadline",
			"duration_minutes",
			"category_id",
			"constraint",
			"title",
			"description",
			"created_at",
			"updated_at"
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING "one_off_task_id"
	`

	// Log the values being inserted for debugging
	log.Printf("[DEBUG] CreateOneOffTask: Task values - UserID: %v, Deadline: %v, DurationMinutes: %v, CategoryID: %v, Constraint: %s, Title: %s, Description: %s, CreatedAt: %v, UpdatedAt: %v",
		taskRequest.UserID,
		taskRequest.Deadline,
		taskRequest.DurationMinutes,
		taskRequest.CategoryID,
		taskRequest.Constraint,
		taskRequest.Title,
		taskRequest.Description,
		taskRequest.CreatedAt,
		taskRequest.UpdatedAt)

	err := database.QueryRow(
		insertQuery,
		taskRequest.UserID,
		taskRequest.Deadline,
		taskRequest.DurationMinutes,
		taskRequest.CategoryID,
		taskRequest.Constraint,
		taskRequest.Title,
		taskRequest.Description,
		taskRequest.CreatedAt,
		taskRequest.UpdatedAt,
	).Scan(&taskRequest.OneOffTaskID)

	if err != nil {
		log.Printf("[ERROR] CreateOneOffTask: Failed to insert task: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task"})
		return
	}

	log.Printf("[DEBUG] CreateOneOffTask: Successfully created one-off task with ID %d", taskRequest.OneOffTaskID)
	c.JSON(http.StatusCreated, gin.H{
		"one_off_task": taskRequest,
	})
}

// UpdateOneOffTask updates an existing one-off task
func UpdateOneOffTask(c *gin.Context) {
	// Get the authenticated user ID
	userIDInter, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, ok := userIDInter.(int)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get task ID from URL parameter
	taskIDStr := c.Param("taskID")
	taskID, err := strconv.Atoi(taskIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	// Define a structure to bind the request data
	var taskRequest OneOffTask

	if err := c.ShouldBindJSON(&taskRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get database connection
	database := db.GetDB()
	if database == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}

	// First, verify the task belongs to the user
	verifyQuery := `
		SELECT COUNT(*) FROM "OneOffTasks" 
		WHERE "one_off_task_id" = $1 AND "user_id" = $2
	`
	var count int
	err = database.QueryRow(verifyQuery, taskID, userID).Scan(&count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify task"})
		return
	}
	if count == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "One-off task not found or not owned by user"})
		return
	}

	// Set the updated_at timestamp
	now := time.Now()
	taskRequest.UpdatedAt = &now

	// Dynamically build the update query based on provided fields
	updateQuery := `
		UPDATE "OneOffTasks" SET 
		"updated_at" = $1
	`
	params := []interface{}{now, taskID, userID} // First three parameters are fixed: updated_at, task ID, and user ID
	paramCounter := 4                            // Start after the fixed parameters

	// Build query dynamically based on which fields are provided
	if !taskRequest.Deadline.IsZero() {
		updateQuery += fmt.Sprintf(`, "deadline" = $%d`, paramCounter)
		params = append(params, taskRequest.Deadline)
		paramCounter++
	}
	if taskRequest.DurationMinutes != 0 {
		updateQuery += fmt.Sprintf(`, "duration_minutes" = $%d`, paramCounter)
		params = append(params, taskRequest.DurationMinutes)
		paramCounter++
	}
	if taskRequest.CategoryID != nil {
		updateQuery += fmt.Sprintf(`, "category_id" = $%d`, paramCounter)
		params = append(params, taskRequest.CategoryID)
		paramCounter++
	}
	// Add constraint field handling
	if taskRequest.Constraint != "" {
		updateQuery += fmt.Sprintf(`, "constraint" = $%d`, paramCounter)
		params = append(params, taskRequest.Constraint)
		paramCounter++
	}
	if taskRequest.Title != "" {
		updateQuery += fmt.Sprintf(`, "title" = $%d`, paramCounter)
		params = append(params, taskRequest.Title)
		paramCounter++
	}
	if taskRequest.Description != "" {
		updateQuery += fmt.Sprintf(`, "description" = $%d`, paramCounter)
		params = append(params, taskRequest.Description)
		paramCounter++
	}

	// Complete the query with WHERE clause
	updateQuery += ` WHERE "one_off_task_id" = $2 AND "user_id" = $3`

	// Log the update operation
	log.Printf("[DEBUG] UpdateOneOffTask: Updating task ID %d with values - Deadline: %v, DurationMinutes: %v, CategoryID: %v, Constraint: %s, Title: %s, Description: %s",
		taskID,
		taskRequest.Deadline,
		taskRequest.DurationMinutes,
		taskRequest.CategoryID,
		taskRequest.Constraint,
		taskRequest.Title,
		taskRequest.Description)

	// Execute the update
	result, err := database.Exec(updateQuery, params...)
	if err != nil {
		log.Printf("[ERROR] UpdateOneOffTask: Failed to update task: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No changes made"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "One-off task updated successfully",
		"task_id": taskID,
	})
}

// DeleteOneOffTask deletes a one-off task
func DeleteOneOffTask(c *gin.Context) {
	// Get the authenticated user ID
	userIDInter, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, ok := userIDInter.(int)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get task ID from URL parameter
	taskIDStr := c.Param("taskID")
	taskID, err := strconv.Atoi(taskIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	// Get database connection
	database := db.GetDB()
	if database == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}

	// Delete the task
	deleteQuery := `DELETE FROM "OneOffTasks" WHERE "one_off_task_id" = $1 AND "user_id" = $2`
	result, err := database.Exec(deleteQuery, taskID, userID)
	if err != nil {
		log.Printf("[ERROR] DeleteOneOffTask: Failed to delete task: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "One-off task not found or not owned by user"})
		return
	}

	// Return success response
	c.JSON(http.StatusOK, gin.H{
		"message": "One-off task deleted successfully",
	})
}

// SetupRoutes configures the routes for one-off tasks
func SetupRoutes(router *gin.Engine) {
	log.Printf("[DEBUG] OneOffTasks: Setting up one-off tasks routes...")

	// Create a route group for one-off tasks
	oneOffRoutes := router.Group("/oneofftasks")
	oneOffRoutes.Use(auth.AuthMiddleware()) // Using the auth middleware
	{
		log.Printf("[DEBUG] OneOffTasks: Configuring: GET /oneofftasks")
		oneOffRoutes.GET("", GetOneOffTasks)

		log.Printf("[DEBUG] OneOffTasks: Configuring: GET /oneofftasks/:taskID")
		oneOffRoutes.GET("/:taskID", GetOneOffTask)

		log.Printf("[DEBUG] OneOffTasks: Configuring: POST /oneofftasks")
		oneOffRoutes.POST("", CreateOneOffTask)

		log.Printf("[DEBUG] OneOffTasks: Configuring: PUT /oneofftasks/:taskID")
		oneOffRoutes.PUT("/:taskID", UpdateOneOffTask)

		log.Printf("[DEBUG] OneOffTasks: Configuring: DELETE /oneofftasks/:taskID")
		oneOffRoutes.DELETE("/:taskID", DeleteOneOffTask)
	}

	log.Printf("[DEBUG] OneOffTasks: Routes setup complete.")
}
