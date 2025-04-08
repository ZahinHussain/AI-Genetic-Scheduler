package tasks

import (
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"api/auth"
)

// TaskStatus represents the status of a task
type TaskStatus string

const (
	StatusPending   TaskStatus = "pending"
	StatusCompleted TaskStatus = "completed"
	StatusCancelled TaskStatus = "cancelled"
	// Add other statuses as needed
)

// Task represents a task in the system, aligned with the database schema
type Task struct {
	TaskID      int        `json:"task_id"`
	UserID      int        `json:"user_id"`
	CalendarID  int        `json:"calendar_id" binding:"required"`
	Title       string     `json:"title" binding:"required"`
	Description string     `json:"description"`
	TaskType    string     `json:"task_type" binding:"required"`
	CategoryID  *int       `json:"category_id"` // Optional field
	Status      TaskStatus `json:"status"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   *time.Time `json:"updated_at"` // Optional field
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
	userID, exists := c.Get("userID")
	if !exists {
		log.Printf("[DEBUG] GetAllTasks: userID not found in context. Auth has failed.")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	log.Printf("[DEBUG] GetAllTasks: Authenticated userID: %v (type: %T)", userID, userID)

	// For testing, return a simple response to confirm it's working
	c.JSON(http.StatusOK, gin.H{
		"tasks": []Task{},
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
	userID, exists := c.Get("userID")
	if !exists {
		log.Printf("[DEBUG] GetTask: userID not found in context. Auth has failed.")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	log.Printf("[DEBUG] GetTask: Authenticated userID: %v for taskID: %d", userID, taskID)

	// For demonstration, we'll just return a mock task
	now := time.Now()
	task := Task{
		TaskID:      taskID,
		UserID:      userID.(int),
		CalendarID:  1,
		Title:       "Example Task",
		Description: "This is an example task",
		TaskType:    "appointment",
		Status:      StatusPending,
		CreatedAt:   now,
	}

	c.JSON(http.StatusOK, gin.H{"task": task})
}

// CreateTask creates a new task
func CreateTask(c *gin.Context) {
	// Enhanced debugging
	log.Printf("[DEBUG] CreateTask: Request received from %s", c.ClientIP())

	var task Task
	if err := c.ShouldBindJSON(&task); err != nil {
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
	task.UserID = userID.(int)

	// Set default values
	task.CreatedAt = time.Now()
	if task.Status == "" {
		task.Status = StatusPending
	}

	// In a real implementation, you would save the task to the database
	// Example: newTask, err := db.CreateTask(task)

	// For demonstration, we'll just return the task with a mock ID
	task.TaskID = 123 // This would be set by the database

	c.JSON(http.StatusCreated, gin.H{"task": task})
}

// UpdateTask updates an existing task
func UpdateTask(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	// Enhanced debugging
	log.Printf("[DEBUG] UpdateTask: Request received for task ID %d", taskID)

	var updateData Task
	if err := c.ShouldBindJSON(&updateData); err != nil {
		log.Printf("[DEBUG] UpdateTask: Invalid JSON data: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from the authenticated user - using key "userID" to match auth.go
	userID, exists := c.Get("userID")
	if !exists {
		log.Printf("[DEBUG] UpdateTask: userID not found in context. Auth has failed.")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	log.Printf("[DEBUG] UpdateTask: Updating task %d for userID: %v", taskID, userID)

	// Set the updated time
	now := time.Now()
	updateData.UpdatedAt = &now

	// Don't allow the client to change the user_id
	updateData.UserID = userID.(int)
	updateData.TaskID = taskID

	c.JSON(http.StatusOK, gin.H{"task": updateData})
}

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

		log.Printf("[DEBUG] Tasks: Configuring: PUT /tasks/:id")
		taskRoutes.PUT("/:id", UpdateTask)

		log.Printf("[DEBUG] Tasks: Configuring: DELETE /tasks/:id")
		taskRoutes.DELETE("/:id", DeleteTask)
	}

	log.Printf("[DEBUG] Tasks: Routes setup complete.")
}
