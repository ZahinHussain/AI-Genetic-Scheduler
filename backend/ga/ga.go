package ga

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"api/auth" // Import auth package for authentication middleware
	"api/db"   // Database connection
)

// TaskRequest represents the JSON structure for the GA route request
type TaskRequest struct {
	Recurring []int `json:"recurring"`
	OneOff    []int `json:"oneOff"`
}

type Constraint string

const (
	Hard Constraint = "hard"
	Soft Constraint = "soft"
	// Add other task types as needed
)

// TaskStatus represents the status of a task
type TaskStatus string

const (
	StatusPending   TaskStatus = "pending"
	StatusCompleted TaskStatus = "completed"
	StatusCancelled TaskStatus = "cancelled"
	// Add other statuses as needed
)

// OneOffTask represents a one-off task with its specific fields
type OneOffTask struct {
	OneOffTaskID    int        `json:"one_off_task_id"`
	UserID          int        `json:"user_id"`
	Deadline        *time.Time `json:"deadline"`
	DurationMinutes int        `json:"duration_minutes"`
	CategoryID      *int       `json:"category_id"`
	Constraint      string     `json:"constraint"`
	Title           string     `json:"title"`
	Description     string     `json:"description"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       *time.Time `json:"updated_at"`
}

type DayOfWeek string

const (
	Monday    DayOfWeek = "Mon"
	Tuesday   DayOfWeek = "Tue"
	Wednesday DayOfWeek = "Wed"
	Thursday  DayOfWeek = "Thu"
	Friday    DayOfWeek = "Fri"
	Saturday  DayOfWeek = "Sat"
	Sunday    DayOfWeek = "Sun"
)

// RecurringTask represents a recurring task with its specific fields
type RecurringTask struct {
	RecurringTaskID int        `json:"recurring_task_id"`
	UserID          int        `json:"user_id"`
	StartDate       DayOfWeek  `json:"start_date"`
	EndDate         *DayOfWeek `json:"end_date"`         // Optional field
	EventStartTime  string     `json:"event_start_time"` // Time format: HH:MM:SS
	EventEndTime    string     `json:"event_end_time"`   // Time format: HH:MM:SS
	CategoryID      *int       `json:"category_id"`      // Optional field
	Constraint      Constraint `json:"constraint"`
	Title           string     `json:"title"`
	Description     string     `json:"description"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       *time.Time `json:"updated_at"` // Optional field
}

// GetTasksResult contains the results of fetching both recurring and one-off tasks
type GetTasksResult struct {
	RecurringTasks []RecurringTask `json:"recurring_tasks"`
	OneOffTasks    []OneOffTask    `json:"one_off_tasks"`
}

// getTasksById retrieves both recurring and one-off tasks by their IDs
func getTasksById(c *gin.Context, recurringIDs []int, oneOffIDs []int) (*GetTasksResult, error) {
	// Get user ID from the authenticated user
	userIDInter, exists := c.Get("userID")
	if !exists {
		return nil, fmt.Errorf("user not authenticated")
	}

	userID, ok := userIDInter.(int)
	if !ok {
		return nil, fmt.Errorf("invalid user ID")
	}

	// Get database connection
	database := db.GetDB()
	if database == nil {
		return nil, fmt.Errorf("database connection error")
	}

	result := &GetTasksResult{
		RecurringTasks: []RecurringTask{},
		OneOffTasks:    []OneOffTask{},
	}

	// Fetch recurring tasks
	if len(recurringIDs) > 0 {
		// Create placeholders for the query
		placeholders := make([]string, len(recurringIDs))
		args := make([]interface{}, len(recurringIDs)+1)
		args[0] = userID // First argument is userID

		for i, id := range recurringIDs {
			placeholders[i] = fmt.Sprintf("$%d", i+2) // +2 because $1 is userID
			args[i+1] = id
		}

		// Construct the query with dynamic placeholders
		query := fmt.Sprintf(`
			SELECT 
				"recurring_task_id", 
				"user_id", 
				"start_date", 
				"end_date", 
				"event_start_time", 
				"event_end_time", 
				"category_id", 
				"constraint",
				"title", 
				"description", 
				"created_at", 
				"updated_at"
			FROM "RecurringTasks"
			WHERE "user_id" = $1 AND "recurring_task_id" IN (%s);
		`, strings.Join(placeholders, ", "))

		// Execute the query
		rows, err := database.Query(query, args...)
		if err != nil {
			return nil, fmt.Errorf("failed to query recurring tasks: %w", err)
		}
		defer rows.Close()

		// Process the recurring tasks
		for rows.Next() {
			var t RecurringTask
			var categoryID sql.NullInt32
			var description sql.NullString
			var updatedAt sql.NullTime
			var endDate sql.NullString
			var startDateStr string
			var constraintStr sql.NullString

			// Match the number of fields in the SELECT query
			err := rows.Scan(
				&t.RecurringTaskID, // 1. recurring_task_id
				&t.UserID,          // 2. user_id
				&startDateStr,      // 3. start_date
				&endDate,           // 4. end_date
				&t.EventStartTime,  // 5. event_start_time
				&t.EventEndTime,    // 6. event_end_time
				&categoryID,        // 7. category_id
				&constraintStr,     // 8. constraint
				&t.Title,           // 9. title
				&description,       // 10. description
				&t.CreatedAt,       // 11. created_at
				&updatedAt,         // 12. updated_at
			)

			if err != nil {
				log.Printf("[ERROR] getTasksById: Row scan failed for recurring task: %v", err)
				continue
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
			if endDate.Valid {
				endDateValue := DayOfWeek(endDate.String)
				t.EndDate = &endDateValue
			}

			// Convert string to DayOfWeek type
			t.StartDate = DayOfWeek(startDateStr)

			// Handle constraint value
			if constraintStr.Valid && constraintStr.String != "" {
				// Check if it's a valid constraint value
				switch Constraint(constraintStr.String) {
				case Hard, Soft:
					t.Constraint = Constraint(constraintStr.String)
				default:
					// Invalid constraint value, use default
					t.Constraint = Hard
				}
			} else {
				// NULL or empty constraint, use default
				t.Constraint = Hard
			}

			result.RecurringTasks = append(result.RecurringTasks, t)
		}

		// Check for errors in the query
		if err := rows.Err(); err != nil {
			log.Printf("[ERROR] getTasksById: Error iterating recurring tasks rows: %v", err)
			return nil, fmt.Errorf("error processing recurring tasks: %w", err)
		}
	}

	// Fetch one-off tasks
	if len(oneOffIDs) > 0 {
		// Create placeholders for the query
		placeholders := make([]string, len(oneOffIDs))
		args := make([]interface{}, len(oneOffIDs)+1)
		args[0] = userID // First argument is userID

		for i, id := range oneOffIDs {
			placeholders[i] = fmt.Sprintf("$%d", i+2) // +2 because $1 is userID
			args[i+1] = id
		}

		// Add a debug log for the SQL query
		oneOffQuery := fmt.Sprintf(`
			SELECT 
				"one_off_task_id", 
				"user_id", 
				"deadline", 
				"duration_minutes", 
				"category_id", 
				"constraint", 
				"title", 
				"description", 
				"created_at", 
				"updated_at"
			FROM "OneOffTasks"
			WHERE "user_id" = $1 AND "one_off_task_id" IN (%s);
		`, strings.Join(placeholders, ", "))

		log.Printf("[DEBUG] getTasksById: OneOff SQL Query: %s", oneOffQuery)

		// Execute the query
		rows, err := database.Query(oneOffQuery, args...)
		if err != nil {
			log.Printf("[ERROR] getTasksById: Failed to query one-off tasks: %v", err)
			return nil, fmt.Errorf("failed to query one-off tasks: %w", err)
		}
		defer rows.Close()

		// Process the one-off tasks
		for rows.Next() {
			var t OneOffTask
			var categoryID sql.NullInt32
			var description sql.NullString
			var updatedAt sql.NullTime
			var durationMinutes sql.NullInt32
			var constraint sql.NullString

			err := rows.Scan(
				&t.OneOffTaskID,  // 1. one_off_task_id
				&t.UserID,        // 2. user_id
				&t.Deadline,      // 3. deadline
				&durationMinutes, // 4. duration_minutes
				&categoryID,      // 5. category_id
				&constraint,      // 6. constraint
				&t.Title,         // 7. title
				&description,     // 8. description
				&t.CreatedAt,     // 9. created_at
				&updatedAt,       // 10. updated_at
			)

			if err != nil {
				log.Printf("[ERROR] getTasksById: Row scan failed for one-off task: %v", err)
				continue
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

			// Handle constraint value
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

			result.OneOffTasks = append(result.OneOffTasks, t)
		}

		// Check for errors in the query
		if err := rows.Err(); err != nil {
			log.Printf("[ERROR] getTasksById: Error iterating one-off tasks rows: %v", err)
			return nil, fmt.Errorf("error processing one-off tasks: %w", err)
		}
	}

	return result, nil
}

// RunGA handles the request to run the genetic algorithm with the provided tasks
func RunGA(c *gin.Context) {
	var request TaskRequest

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
	if err := c.ShouldBindJSON(&request); err != nil {
		log.Printf("[ERROR] RunGA: Invalid request format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Log the request data
	log.Printf("[INFO] RunGA: Received request with %d recurring tasks and %d one-off tasks",
		len(request.Recurring), len(request.OneOff))

	// Get tasks by their IDs
	tasksResult, err := getTasksById(c, request.Recurring, request.OneOff)
	if err != nil {
		log.Printf("[ERROR] RunGA: Failed to get tasks: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Log successful retrieval
	log.Printf("[INFO] RunGA: Successfully retrieved %d recurring tasks and %d one-off tasks",
		len(tasksResult.RecurringTasks), len(tasksResult.OneOffTasks))

	// Log the received data for debugging
	c.JSON(http.StatusOK, gin.H{
		"message":         "Genetic algorithm request received",
		"user_id":         userID,
		"recurring_tasks": tasksResult.RecurringTasks,
		"one_off_tasks":   tasksResult.OneOffTasks,
	})

	// TODO: Add actual GA implementation logic here
	// This would call into your GA package functionality
	// For example: results := RunGeneticAlgorithm(tasksResult.RecurringTasks, tasksResult.OneOffTasks)
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
