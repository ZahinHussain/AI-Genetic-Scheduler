package schedule

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// Task represents a simple task structure
type Task struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	StartDate   time.Time `json:"startDate"`
	EndDate     time.Time `json:"endDate"`
	Description string    `json:"description"`
}

// SetupRoutes configures routes for schedule generation
func SetupRoutes(router *gin.Engine) {
	log.Println("Setting up schedule generation routes...")

	// Create a route group for scheduling
	scheduleRoutes := router.Group("/schedule")
	{
		scheduleRoutes.GET("/generate", GenerateSchedule)
		scheduleRoutes.POST("/generate", GenerateSchedulePost)
	}

	log.Println("Schedule routes setup complete.")
}

// GenerateSchedule handles GET requests for schedule generation
func GenerateSchedule(c *gin.Context) {
	// Get task IDs from query parameters
	recurringParam := c.Query("recurring")
	oneOffParam := c.Query("oneoff")

	// Log the inputs
	fmt.Printf("GenerateSchedule GET request received:\n")
	fmt.Printf("  Recurring tasks: %s\n", recurringParam)
	fmt.Printf("  One-off tasks: %s\n", oneOffParam)

	// Parse recurring task IDs
	var recurringIds []int
	if recurringParam != "" {
		for _, idStr := range strings.Split(recurringParam, ",") {
			id, err := strconv.Atoi(idStr)
			if err == nil {
				recurringIds = append(recurringIds, id)
			}
		}
	}

	// Parse one-off task IDs
	var oneOffIds []int
	if oneOffParam != "" {
		for _, idStr := range strings.Split(oneOffParam, ",") {
			id, err := strconv.Atoi(idStr)
			if err == nil {
				oneOffIds = append(oneOffIds, id)
			}
		}
	}

	// Debug print
	fmt.Printf("Parsed task IDs:\n")
	fmt.Printf("  Recurring IDs: %v\n", recurringIds)
	fmt.Printf("  One-off IDs: %v\n", oneOffIds)

	// Generate a sample schedule
	schedule := generateSampleSchedule(recurringIds, oneOffIds)

	// Debug print the generated schedule
	scheduleJSON, _ := json.MarshalIndent(schedule, "", "  ")
	fmt.Printf("Generated schedule:\n%s\n", string(scheduleJSON))

	// Return the response
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Schedule generated successfully",
		"data":    schedule,
	})
}

// GenerateSchedulePost handles POST requests for schedule generation
func GenerateSchedulePost(c *gin.Context) {
	// Define request structure
	var request struct {
		RecurringTaskIds []int `json:"recurringTaskIds"`
		OneOffTaskIds    []int `json:"oneOffTaskIds"`
	}

	// Parse request body
	if err := c.ShouldBindJSON(&request); err != nil {
		fmt.Printf("Error parsing request: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request format",
		})
		return
	}

	// Log the inputs
	fmt.Printf("GenerateSchedule POST request received:\n")
	fmt.Printf("  Recurring task IDs: %v\n", request.RecurringTaskIds)
	fmt.Printf("  One-off task IDs: %v\n", request.OneOffTaskIds)

	// Generate a sample schedule
	schedule := generateSampleSchedule(request.RecurringTaskIds, request.OneOffTaskIds)

	// Debug print the generated schedule
	scheduleJSON, _ := json.MarshalIndent(schedule, "", "  ")
	fmt.Printf("Generated schedule:\n%s\n", string(scheduleJSON))

	// Return the response
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Schedule generated successfully",
		"data":    schedule,
	})
}

// generateSampleSchedule creates a sample schedule for testing
func generateSampleSchedule(recurringIds, oneOffIds []int) []Task {
	now := time.Now()
	schedule := []Task{}

	// Generate sample tasks for recurring IDs
	for i, id := range recurringIds {
		startTime := now.Add(time.Duration(i*2) * time.Hour)
		endTime := startTime.Add(1 * time.Hour)

		task := Task{
			ID:          id,
			Title:       fmt.Sprintf("Recurring Task %d", id),
			StartDate:   startTime,
			EndDate:     endTime,
			Description: fmt.Sprintf("This is recurring task %d", id),
		}
		schedule = append(schedule, task)

		fmt.Printf("Added recurring task: ID=%d, Start=%s, End=%s\n",
			id, startTime.Format(time.RFC3339), endTime.Format(time.RFC3339))
	}

	// Generate sample tasks for one-off IDs
	for i, id := range oneOffIds {
		startTime := now.Add(time.Duration(24+i*3) * time.Hour)
		endTime := startTime.Add(2 * time.Hour)

		task := Task{
			ID:          id + 1000, // Offset to distinguish from recurring tasks
			Title:       fmt.Sprintf("One-off Task %d", id),
			StartDate:   startTime,
			EndDate:     endTime,
			Description: fmt.Sprintf("This is one-off task %d", id),
		}
		schedule = append(schedule, task)

		fmt.Printf("Added one-off task: ID=%d, Start=%s, End=%s\n",
			id, startTime.Format(time.RFC3339), endTime.Format(time.RFC3339))
	}

	return schedule
}
