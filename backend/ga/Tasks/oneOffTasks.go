package Tasks

import (
	"api/db"
	"fmt"
)

type OneOffTask struct {
	TaskId      int
	Deadline    int
	Slots       int // Represents duration in 15-minute slots
	Constraint  string
	Title       string
	Description string
}

func getOneOffTaskDB() {

	dbConn := db.GetDB()

	// Basic SELECT statement to retrieve one-off tasks
	query := `
		SELECT id, title, description, duration_minutes, priority, deadline, user_id 
		FROM one_off_tasks 
		WHERE is_completed = false
		ORDER BY deadline ASC, priority DESC
	`

	// Execute the query
	rows, err := dbConn.Query(query)
	if err != nil {
		return nil, fmt.Errorf("error querying one-off tasks: %w", err)
	}
	defer rows.Close()

	// Store the results
	var tasks []OneOffTask

	// Iterate through the result rows
	for rows.Next() {
		var task OneOffTask
		var deadline sql.NullTime // Handle nullable deadline

		// Scan the row into our struct
		err := rows.Scan(
			&task.ID,
			&task.Title,
			&task.Description,
			&task.DurationMinutes,
			&task.Priority,
			&deadline,
			&task.UserID,
		)

		if err != nil {
			return nil, fmt.Errorf("error scanning one-off task row: %w", err)
		}

		// Handle nullable deadline
		if deadline.Valid {
			task.Deadline = deadline.Time
		}

		// Add to our slice of tasks
		tasks = append(tasks, task)
	}

	// Check for errors from iterating over rows
	if err = rows.Err(); err != nil {
		return
	}

}

func CreateOneOffTask() []OneOffTask {
	// 1. Declare an empty slice
	var schedule []OneOffTask

	// 2. Append each task individually, with pre-calculated slots
	// Task 1: DSP Objective - Understanding Core Concepts (180 min / 15 = 12 slots)
	schedule = append(schedule, OneOffTask{
		TaskId:      7,
		Slots:       12,
		Deadline:    0,
		Constraint:  "soft",
		Title:       "Review Core DSP Principles for Project",
		Description: "Solidify understanding of filtering and FFTs as required for the main DSP objectives. Re-read relevant chapters/notes.",
	})

	// Task 2: DSP Objective - Algorithm Implementation Planning (90 min / 15 = 6 slots)
	schedule = append(schedule, OneOffTask{
		TaskId:      8,
		Slots:       6, // Pre-calculated
		Deadline:    0,
		Constraint:  "soft",
		Title:       "Outline DSP Algorithm Implementation Steps",
		Description: "Break down the required DSP algorithm into smaller, implementable modules. Define inputs/outputs for each.",
	})

	// Task 3: GA Account Goal - Performance Analysis (120 min / 15 = 8 slots)
	schedule = append(schedule, OneOffTask{
		TaskId:      9,
		Slots:       8, // Pre-calculated
		Deadline:    0,
		Constraint:  "soft",
		Title:       "Analyze GA Account Performance Trends",
		Description: "Review key metrics (users, sessions, conversions) in the GA account for the last quarter. Identify significant changes or trends.",
	})

	// Task 4: GA Account Goal - Reporting Structure (60 min / 15 = 4 slots)
	schedule = append(schedule, OneOffTask{
		TaskId:      10,
		Slots:       4, // Pre-calculated
		Deadline:    0,
		Constraint:  "soft",
		Title:       "Define GA Reporting Structure",
		Description: "Plan the structure and key sections for the next GA performance report. What data needs to be presented?",
	})

	// Task 5: General Skill Development (Supports DSP/GA goals) (75 min / 15 = 5 slots)
	schedule = append(schedule, OneOffTask{
		TaskId:      11,
		Slots:       5, // Pre-calculated
		Deadline:    0,
		Constraint:  "soft",
		Title:       "Explore Advanced Features in Analysis Tool",
		Description: "Investigate advanced features (e.g., custom segments in GA, specific library functions for DSP) relevant to current aims.",
	})

	// Task 6: DSP Objective - Prepare for Supervisor Meeting (45 min / 15 = 3 slots)
	schedule = append(schedule, OneOffTask{
		TaskId:      12,
		Slots:       3, // Pre-calculated (45 / 15 = 3)
		Deadline:    0,
		Constraint:  "soft",
		Title:       "Prepare Questions/Updates for DSP Meeting",
		Description: "List key progress points, challenges encountered, and questions to ask during the next meeting with the DSP supervisor.",
	})

	// 3. Return the populated slice
	return schedule
}
