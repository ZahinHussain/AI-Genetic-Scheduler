package auth

import (
	"api/db" // Import the db package
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings" // Added for header processing
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// Environment variable keys
const (
	ENV_JWT_SECRET       = "JWT_SECRET"
	ENV_JWT_EXPIRY_HOURS = "JWT_EXPIRY_HOURS"
	ENV_COOKIE_SECURE    = "COOKIE_SECURE"
	ENV_COOKIE_DOMAIN    = "COOKIE_DOMAIN"
)

// Configuration loaded from environment
var (
	jwtSecret       []byte
	tokenExpiration time.Duration
	cookieSecure    bool
	cookieDomain    string
)

// Initialize configuration from environment variables
func init() {
	log.Println("[DEBUG] Initializing auth package configuration...") // Added debug log

	// Load JWT secret - critical for security
	secret := os.Getenv(ENV_JWT_SECRET)
	if secret == "" {
		// In development, generate a random secret
		if gin.Mode() == gin.DebugMode {
			secret = fmt.Sprintf("dev-secret-%d", time.Now().UnixNano())
			log.Printf("[DEBUG] WARNING: Using auto-generated JWT secret for development. Set %s environment variable in production.", ENV_JWT_SECRET)
		} else {
			// In production, fail if no secret is provided
			log.Fatalf("ERROR: %s environment variable must be set in production mode", ENV_JWT_SECRET)
		}
	} else {
		log.Printf("[DEBUG] Loaded JWT_SECRET from environment.") // Added debug log
	}
	jwtSecret = []byte(secret)

	// Load token expiration time (default: 24 hours)
	expiryHours := 24
	if envExpiry := os.Getenv(ENV_JWT_EXPIRY_HOURS); envExpiry != "" {
		if parsed, err := strconv.Atoi(envExpiry); err == nil && parsed > 0 {
			expiryHours = parsed
			log.Printf("[DEBUG] Loaded JWT_EXPIRY_HOURS: %d hours", expiryHours) // Added debug log
		} else {
			log.Printf("[DEBUG] WARN: Invalid JWT_EXPIRY_HOURS value '%s', using default %d hours", envExpiry, expiryHours)
		}
	} else {
		log.Printf("[DEBUG] JWT_EXPIRY_HOURS not set, using default %d hours", expiryHours)
	}
	tokenExpiration = time.Duration(expiryHours) * time.Hour

	// Cookie security settings
	cookieSecure = false
	if secure := os.Getenv(ENV_COOKIE_SECURE); secure == "true" {
		cookieSecure = true
	}
	log.Printf("[DEBUG] Cookie Secure setting: %v (from COOKIE_SECURE=%s)", cookieSecure, os.Getenv(ENV_COOKIE_SECURE)) // Added debug log

	cookieDomain = os.Getenv(ENV_COOKIE_DOMAIN)                                                                           // Empty is fine for same-origin cookies
	log.Printf("[DEBUG] Cookie Domain setting: '%s' (from COOKIE_DOMAIN=%s)", cookieDomain, os.Getenv(ENV_COOKIE_DOMAIN)) // Added debug log

	log.Printf("Auth configuration complete: token expiry=%v, secure cookies=%v, cookie domain='%s'", tokenExpiration, cookieSecure, cookieDomain)
}

// User represents a basic user model matching the database schema
type User struct {
	UserID    int       `json:"user_id"`
	Email     string    `json:"email" binding:"required,email"`
	Password  string    `json:"password" binding:"required,min=6"` // Keep for binding
	CreatedAt time.Time `json:"created_at"`
}

// UserResponse is what we return to clients (without sensitive data)
type UserResponse struct {
	UserID    int       `json:"user_id"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

// Claims represents the JWT claims
type Claims struct {
	UserID int    `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// hashPassword hashes a password using bcrypt
func hashPassword(password string) (string, error) {
	log.Printf("[DEBUG] Hashing password...") // Added debug log
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	if err != nil {
		log.Printf("[DEBUG] Error hashing password: %v", err)
	} else {
		log.Printf("[DEBUG] Password hashing successful.")
	}
	return string(bytes), err
}

// checkPasswordHash compares a password with a hash
func checkPasswordHash(password, hash string) bool {
	log.Printf("[DEBUG] Comparing provided password with stored hash...") // Added debug log
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	log.Printf("[DEBUG] Password comparison result: match=%v (err: %v)", err == nil, err) // Added debug log
	return err == nil
}

// generateJWT creates a new JWT token for a user
func generateJWT(userID int, email string) (string, error) {
	log.Printf("[DEBUG] Generating JWT for UserID: %d, Email: %s", userID, email) // Added debug log
	expirationTime := time.Now().Add(tokenExpiration)
	claims := &Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   strconv.Itoa(userID), // Use UserID as subject for consistency
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		log.Printf("[DEBUG] Error signing JWT: %v", err) // Added debug log
		return "", err
	}

	log.Printf("[DEBUG] JWT generated successfully.") // Added debug log
	return tokenString, nil
}

// validateJWT validates a JWT token and returns the claims
func validateJWT(tokenString string) (*Claims, error) {
	log.Printf("[DEBUG] Validating JWT...") // Added debug log
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		// Don't forget to validate the alg is what you expect:
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			log.Printf("[DEBUG] JWT validation error: unexpected signing method: %v", token.Header["alg"])
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		log.Printf("[DEBUG] JWT validation error: %v", err) // Added debug log
		return nil, err
	}

	if !token.Valid {
		log.Printf("[DEBUG] JWT validation failed: Token is invalid") // Added debug log
		return nil, fmt.Errorf("invalid token")
	}

	log.Printf("[DEBUG] JWT validation successful. Claims: UserID=%d, Email=%s, ExpiresAt=%v", claims.UserID, claims.Email, claims.ExpiresAt) // Added debug log
	return claims, nil
}

// setCookie sets a JWT cookie
func setCookie(c *gin.Context, token string) {
	maxAge := int(tokenExpiration.Seconds())
	path := "/"
	domain := cookieDomain
	secure := cookieSecure
	httpOnly := true

	log.Printf("[DEBUG] Setting cookie: Name=auth_token, MaxAge=%d, Path=%s, Domain=%s, Secure=%v, HttpOnly=%v", maxAge, path, domain, secure, httpOnly) // Added debug log

	c.SetCookie(
		"auth_token",
		token,
		maxAge,
		path,
		domain,
		secure,   // Secure - true in production with HTTPS
		httpOnly, // HTTP only - prevents JavaScript access
	)
}

// Signup handles user registration
func Signup(c *gin.Context) {
	log.Printf("[DEBUG] Signup: Request received.") // Added debug log
	var user User
	if err := c.ShouldBindJSON(&user); err != nil {
		log.Printf("[DEBUG] Signup: Failed to bind JSON: %v", err) // Added debug log
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}
	log.Printf("[DEBUG] Signup: Received data for email: %s", user.Email) // Added debug log

	// Connect to the database
	database := db.GetDB()
	if database == nil {
		log.Printf("[DEBUG] Signup: Database connection not initialized.") // Added debug log
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not initialized"})
		return
	}
	log.Printf("[DEBUG] Signup: Database connection obtained.") // Added debug log

	// Check if user already exists
	var exists bool
	log.Printf("[DEBUG] Signup: Checking if user exists: %s", user.Email) // Added debug log
	err := database.QueryRow("SELECT EXISTS(SELECT 1 FROM \"Users\" WHERE email = $1)", user.Email).Scan(&exists)
	if err != nil {
		log.Printf("ERROR: Signup: Database error checking user existence: %v", err) // Keep as ERROR
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	log.Printf("[DEBUG] Signup: User exists check result for %s: %v", user.Email, exists) // Added debug log
	if exists {
		log.Printf("[DEBUG] Signup: User %s already exists. Returning 400.", user.Email) // Added debug log
		c.JSON(http.StatusBadRequest, gin.H{"error": "User with this email already exists"})
		return
	}

	// Hash the password
	hashedPassword, err := hashPassword(user.Password)
	if err != nil {
		log.Printf("ERROR: Signup: Error hashing password: %v", err) // Keep as ERROR
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error processing password"})
		return
	}

	// Insert the new user
	var userID int
	insertTime := time.Now()
	log.Printf("[DEBUG] Signup: Inserting new user: %s", user.Email) // Added debug log
	err = database.QueryRow(
		"INSERT INTO \"Users\" (email, password_hash, created_at) VALUES ($1, $2, $3) RETURNING user_id",
		user.Email, hashedPassword, insertTime,
	).Scan(&userID)
	if err != nil {
		log.Printf("ERROR: Signup: Database error creating user: %v", err) // Keep as ERROR
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating user"})
		return
	}

	// Create default user preferences - fixed query to not attempt to scan result when none is returned
	_, err = database.Exec(
		"INSERT INTO \"UserPreferences\" (user_id) VALUES ($1)",
		userID,
	)
	if err != nil {
		log.Printf("ERROR: Signup: Database error creating user preferences: %v", err) // Keep as ERROR
		// Note: User is created but preferences failed. Consider whether to delete the user or handle this case.
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error setting up user preferences"})
		return
	}
	log.Printf("[DEBUG] Signup: User %s created successfully with UserID: %d and default preferences", user.Email, userID) // Updated debug log

	// Generate JWT token
	token, err := generateJWT(userID, user.Email)
	if err != nil {
		log.Printf("ERROR: Signup: Error generating token for UserID %d: %v", userID, err) // Keep as ERROR
		// Note: User is created, but token failed. Consider how to handle this state.
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating authentication token"})
		return
	}

	// Set cookie with JWT
	setCookie(c, token)

	// Prepare response data
	responseUser := UserResponse{
		UserID:    userID,
		Email:     user.Email,
		CreatedAt: insertTime, // Use the time when it was inserted
	}

	log.Printf("[DEBUG] Signup: Sending 201 Created response for UserID %d", userID) // Added debug log
	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
		"token":   token, // Also return token in response for API usage
		"user":    responseUser,
	})
}

// Login handles user authentication
func Login(c *gin.Context) {
	log.Printf("[DEBUG] Login: Request received from %s for path %s", c.ClientIP(), c.Request.URL.Path) // Added debug log
	var loginData struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&loginData); err != nil {
		log.Printf("[DEBUG] Login: Failed to bind JSON: %v", err) // Added debug log
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}
	log.Printf("[DEBUG] Login: Received login attempt for email: %s", loginData.Email) // Added debug log

	// Connect to the database
	database := db.GetDB()
	if database == nil {
		log.Printf("[DEBUG] Login: Database connection not initialized.") // Added debug log
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not initialized"})
		return
	}
	log.Printf("[DEBUG] Login: Database connection obtained.") // Added debug log

	// Retrieve user from database
	var user struct {
		UserID       int
		Email        string
		PasswordHash string
		CreatedAt    time.Time
	}

	log.Printf("[DEBUG] Login: Querying database for user: %s", loginData.Email) // Added debug log
	err := database.QueryRow(
		"SELECT user_id, email, password_hash, created_at FROM \"Users\" WHERE email = $1",
		loginData.Email,
	).Scan(&user.UserID, &user.Email, &user.PasswordHash, &user.CreatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("[DEBUG] Login: User not found in database: %s", loginData.Email) // Added debug log
		} else {
			log.Printf("ERROR: Login: Database error querying user %s: %v", loginData.Email, err) // Keep as ERROR
		}
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"}) // Generic error for security
		return
	}
	log.Printf("[DEBUG] Login: User found in database: UserID=%d, Email=%s", user.UserID, user.Email) // Added debug log

	// Check password
	passwordMatch := checkPasswordHash(loginData.Password, user.PasswordHash)
	if !passwordMatch {
		log.Printf("[DEBUG] Login: Password mismatch for user: %s (UserID: %d)", user.Email, user.UserID) // Added debug log
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})                            // Generic error for security
		return
	}
	log.Printf("[DEBUG] Login: Password matches for user: %s (UserID: %d)", user.Email, user.UserID) // Added debug log

	// Generate JWT token
	token, err := generateJWT(user.UserID, user.Email)
	if err != nil {
		log.Printf("ERROR: Login: Error generating token for UserID %d: %v", user.UserID, err) // Keep as ERROR
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating authentication token"})
		return
	}

	// Set cookie with JWT
	setCookie(c, token)

	// Prepare response data
	responseUser := UserResponse{
		UserID:    user.UserID,
		Email:     user.Email,
		CreatedAt: user.CreatedAt,
	}
	log.Printf("[DEBUG] Login: Sending 200 OK response for UserID %d", user.UserID) // Added debug log
	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"token":   token, // Also return token in response for API usage
		"user":    responseUser,
	})
}

// Logout handles user logout by clearing the cookie
func Logout(c *gin.Context) {
	log.Printf("[DEBUG] Logout: Request received from %s", c.ClientIP())     // Added debug log
	log.Printf("[DEBUG] Logout: Clearing cookie 'auth_token'")               // Added debug log
	c.SetCookie("auth_token", "", -1, "/", cookieDomain, cookieSecure, true) // Expire the cookie
	log.Printf("[DEBUG] Logout: Sending 200 OK response.")                   // Added debug log
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// GetCurrentUser returns the current authenticated user
func GetCurrentUser(c *gin.Context) {
	log.Printf("[DEBUG] GetCurrentUser: Request received.") // Added debug log
	userIDRaw, exists := c.Get("userID")
	if !exists {
		log.Printf("[DEBUG] GetCurrentUser: UserID not found in context. Sending 401.") // Added debug log
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	emailRaw, exists := c.Get("email")
	if !exists {
		log.Printf("[DEBUG] GetCurrentUser: Email not found in context. Sending 500.")               // Added debug log
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User data inconsistency in context"}) // More specific error
		return
	}

	// Type assertions
	userID, ok := userIDRaw.(int)
	if !ok {
		log.Printf("[DEBUG] GetCurrentUser: UserID in context is not an int (%T). Sending 500.", userIDRaw) // Added debug log
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error processing user data"})
		return
	}
	email, ok := emailRaw.(string)
	if !ok {
		log.Printf("[DEBUG] GetCurrentUser: Email in context is not a string (%T). Sending 500.", emailRaw) // Added debug log
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error processing user data"})
		return
	}

	log.Printf("[DEBUG] GetCurrentUser: Found UserID %d and Email %s in context. Sending 200 OK.", userID, email) // Added debug log
	c.JSON(http.StatusOK, gin.H{
		"user": UserResponse{
			UserID: userID,
			Email:  email,
			// CreatedAt is not available here without another DB lookup, omit it or fetch if needed
		},
	})
}

// AuthMiddleware validates JWT from cookies or Authorization header
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Printf("[DEBUG] AuthMiddleware: Processing request for %s %s", c.Request.Method, c.Request.URL.Path) // Added debug log
		var tokenString string
		var tokenSource string // To log where the token came from

		// First check the cookie
		cookieToken, err := c.Cookie("auth_token")
		if err == nil && cookieToken != "" {
			tokenString = cookieToken
			tokenSource = "cookie"
			log.Printf("[DEBUG] AuthMiddleware: Found token in 'auth_token' cookie.") // Added debug log
		} else {
			// If cookie not found or error (e.g., http.ErrNoCookie), check Authorization header
			if err != http.ErrNoCookie {
				log.Printf("[DEBUG] AuthMiddleware: Error reading 'auth_token' cookie: %v", err) // Log other cookie errors
			}
			log.Printf("[DEBUG] AuthMiddleware: Cookie not found or empty, checking Authorization header.") // Added debug log
			authHeader := c.GetHeader("Authorization")
			if len(authHeader) > 7 && strings.ToLower(authHeader[:7]) == "bearer " {
				tokenString = authHeader[7:]
				tokenSource = "header"
				log.Printf("[DEBUG] AuthMiddleware: Found token in Authorization header.") // Added debug log
			}
		}

		if tokenString == "" {
			log.Printf("[DEBUG] AuthMiddleware: No token found in cookie or Authorization header. Aborting with 401.") // Added debug log
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		log.Printf("[DEBUG] AuthMiddleware: Attempting to validate token found via %s.", tokenSource) // Added debug log
		// Validate the token
		claims, err := validateJWT(tokenString)
		if err != nil {
			// Error already logged inside validateJWT
			log.Printf("[DEBUG] AuthMiddleware: Token validation failed. Aborting with 401.") // Added debug log
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Set user data in context for later use
		log.Printf("[DEBUG] AuthMiddleware: Token validation successful (UserID: %d). Setting context and calling next handler.", claims.UserID) // Added debug log
		c.Set("userID", claims.UserID)
		c.Set("email", claims.Email)

		c.Next() // Proceed to the next handler
	}
}

// SetupRoutes configures the auth routes
func SetupRoutes(router *gin.Engine) {
	log.Printf("[DEBUG] Setting up /auth routes...") // Added debug log
	authRoutes := router.Group("/auth")
	{
		log.Printf("[DEBUG] Configuring: POST /auth/signup")
		authRoutes.POST("/signup", Signup)
		log.Printf("[DEBUG] Configuring: POST /auth/login")
		authRoutes.POST("/login", Login)
		log.Printf("[DEBUG] Configuring: POST /auth/logout")
		authRoutes.POST("/logout", Logout)

		// Protected routes
		protected := authRoutes.Group("")
		log.Printf("[DEBUG] Applying AuthMiddleware to subsequent /auth routes...")
		protected.Use(AuthMiddleware())
		{
			log.Printf("[DEBUG] Configuring: GET /auth/me (protected)")
			protected.GET("/me", GetCurrentUser)
			// Add other protected auth-related routes here if needed
		}
	}
	log.Printf("[DEBUG] Auth routes setup complete.") // Added debug log
}

// --- Helper: Add a Ping route for basic connectivity testing ---
func Ping(c *gin.Context) {
	log.Printf("[DEBUG] Ping: Request received.")
	c.JSON(http.StatusOK, gin.H{"message": "pong"})
}

// Add this function to your main setup or where you configure general routes
func SetupPingRoute(router *gin.Engine) {
	log.Printf("[DEBUG] Configuring: GET /api/ping")
	// Assuming your API routes are grouped under /api
	apiRoutes := router.Group("/api")
	{
		apiRoutes.GET("/ping", Ping)
	}
}
