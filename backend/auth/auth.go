package auth

import (
	"log"
	"net/http"
	"time"

	"api/db" // Import the db package
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// User represents a basic user model matching the database schema
type User struct {
	UserID    int       `json:"user_id"`
	Email     string    `json:"email" binding:"required,email"`
	Password  string    `json:"password" binding:"required,min=6"`
	CreatedAt time.Time `json:"created_at"`
}

// UserResponse is what we return to clients (without sensitive data)
type UserResponse struct {
	UserID    int       `json:"user_id"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

// hashPassword hashes a password using bcrypt
func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

// checkPasswordHash compares a password with a hash
func checkPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// Signup handles user registration
func Signup(c *gin.Context) {
	var user User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Connect to the database
	database := db.GetDB()
	if database == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not initialized"})
		return
	}

	// Check if user already exists
	var exists bool
	err := database.QueryRow("SELECT EXISTS(SELECT 1 FROM \"Users\" WHERE email = $1)", user.Email).Scan(&exists)
	if err != nil {
		log.Printf("Database error checking user existence: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	if exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User with this email already exists"})
		return
	}

	// Hash the password
	hashedPassword, err := hashPassword(user.Password)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error processing password"})
		return
	}

	// Insert the new user
	var userID int
	err = database.QueryRow(
		"INSERT INTO \"Users\" (email, password_hash, created_at) VALUES ($1, $2, $3) RETURNING user_id",
		user.Email, hashedPassword, time.Now(),
	).Scan(&userID)

	if err != nil {
		log.Printf("Database error creating user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
		"user": UserResponse{
			UserID:    userID,
			Email:     user.Email,
			CreatedAt: time.Now(),
		},
	})
}

// Login handles user authentication
func Login(c *gin.Context) {
	var loginData struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&loginData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Connect to the database
	database := db.GetDB()
	if database == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not initialized"})
		return
	}

	// Retrieve user from database
	var user struct {
		UserID       int
		Email        string
		PasswordHash string
		CreatedAt    time.Time
	}

	err := database.QueryRow(
		"SELECT user_id, email, password_hash, created_at FROM \"Users\" WHERE email = $1",
		loginData.Email,
	).Scan(&user.UserID, &user.Email, &user.PasswordHash, &user.CreatedAt)

	if err != nil {
		log.Printf("User not found or database error: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Check password
	if !checkPasswordHash(loginData.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// In a real-world application, you would generate a JWT token here
	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"user": UserResponse{
			UserID:    user.UserID,
			Email:     user.Email,
			CreatedAt: user.CreatedAt,
		},
	})
}

// SetupRoutes configures the auth routes
func SetupRoutes(router *gin.Engine) {
	authRoutes := router.Group("/auth")
	{
		authRoutes.POST("/signup", Signup)
		authRoutes.POST("/login", Login)
	}
}
