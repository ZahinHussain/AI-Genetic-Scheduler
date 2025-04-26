package Tasks

import (
	"api/db"
	"database/sql"
	"fmt"
	"time"

	"github.com/lib/pq"
)

type OneOffTaskGA struct {
	TaskId      int
	Deadline    int
	Slots       int // Represents duration in 15-minute slots
	Constraint  string
	Title       string
	Description string
}

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

func FetchOneOffTaskByDB(userID int, taskIDs []int) ([]OneOffTask, error) {
	dbConn := db.GetDB()
	if dbConn == nil {
		return nil, fmt.Errorf("failed to get database connection")
	}

	// Basic SELECT statement to retrieve one-off tasks
	query := `
		SELECT "one_off_task_id", "title", "description", "duration_minutes", 
		       "constraint", "deadline", "user_id", "category_id", "created_at", "updated_at"
		FROM "OneOffTasks" 
		WHERE "user_id" = $1 AND "one_off_task_id" = ANY($2)
	`

	// Execute the query with parameters
	rows, err := dbConn.Query(query, userID, pq.Array(taskIDs))
	if err != nil {
		return nil, fmt.Errorf("error querying one-off tasks: %w", err)
	}
	defer rows.Close()

	// Store the results
	var tasks []OneOffTask

	// Iterate through the result rows
	for rows.Next() {
		var task OneOffTask
		var deadline sql.NullTime         // Handle nullable deadline
		var description sql.NullString    // Handle nullable description
		var categoryID sql.NullInt32      // Handle nullable category ID
		var updatedAt sql.NullTime        // Handle nullable updated_at
		var durationMinutes sql.NullInt32 // Handle nullable duration
		var constraint sql.NullString     // Handle nullable constraint

		// Scan the row into our struct
		err := rows.Scan(
			&task.OneOffTaskID,
			&task.Title,
			&description,
			&durationMinutes,
			&constraint,
			&deadline,
			&task.UserID,
			&categoryID,
			&task.CreatedAt,
			&updatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("error scanning one-off task row: %w", err)
		}

		// Handle nullable fields
		if deadline.Valid {
			task.Deadline = &deadline.Time
		}

		if description.Valid {
			task.Description = description.String
		}

		if categoryID.Valid {
			catID := int(categoryID.Int32)
			task.CategoryID = &catID
		}

		if updatedAt.Valid {
			task.UpdatedAt = &updatedAt.Time
		}

		if durationMinutes.Valid {
			task.DurationMinutes = int(durationMinutes.Int32)
		}

		if constraint.Valid {
			task.Constraint = constraint.String
		} else {
			task.Constraint = string(Soft) // Default to soft constraint
		}

		// Add to our slice of tasks
		tasks = append(tasks, task)
	}
	fmt.Println("Fetched %d one-off tasks\n", len(tasks))

	// Check for errors from iterating over rows
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over one-off task rows: %w", err)
	}

	fmt.Printf("Fetched %d one-off tasks\n", len(tasks))

	return tasks, nil
}

func ConvertOneOffTasksToGA(tasks []OneOffTask) []OneOffTaskGA {
	var result []OneOffTaskGA

	for _, task := range tasks {
		// Calculate deadline epoch days (days since Jan 1, 2000)
		var deadline int
		if task.Deadline != nil {
			// Convert deadline to days since Jan 1, 2000
			baseDate := time.Date(2000, 1, 1, 0, 0, 0, 0, time.UTC)
			deadline = int(task.Deadline.Sub(baseDate).Hours() / 24)
		} else {

			deadline = 0
		}

		// Calculate duration in 15-minute slots
		slots := task.DurationMinutes / 15
		if task.DurationMinutes%15 > 0 {
			slots++ // Round up to next 15-minute slot
		}

		// Default to at least 1 slot (15 minutes)
		if slots < 1 {
			slots = 1
		}

		gaTask := OneOffTaskGA{
			TaskId:      task.OneOffTaskID,
			Deadline:    deadline,
			Slots:       slots,
			Constraint:  task.Constraint,
			Title:       task.Title,
			Description: task.Description,
		}

		result = append(result, gaTask)
	}

	return result
}
