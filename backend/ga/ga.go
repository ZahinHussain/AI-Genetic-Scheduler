package ga

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// TaskRequest represents the JSON structure for the GA route request
type TaskRequest struct {
	Recurring []int `json:"recurring"`
	OneOff    []int `json:"oneOff"`
}

// RunGA handles the request to run the genetic algorithm with the provided tasks
func RunGA(c *gin.Context) {
	var request TaskRequest

	// Bind JSON request to the struct
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Log the received data for debugging
	c.JSON(http.StatusOK, gin.H{
		"message":         "Genetic algorithm request received",
		"recurring_tasks": request.Recurring,
		"oneoff_tasks":    request.OneOff,
	})

	// TODO: Add actual GA implementation logic here
	// This would call into your GA package functionality
	// For example: results := RunGeneticAlgorithm(request.Recurring, request.OneOff)
}

// SetupRoutes configures the GA routes
func SetupRoutes(router *gin.Engine) {
	// Creating a route group for /ga
	gaGroup := router.Group("/ga")
	{
		// This will make the endpoint available at /ga
		gaGroup.POST("/", RunGA)
	}
}
