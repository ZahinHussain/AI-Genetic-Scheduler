FROM golang:1.24.2-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy go.mod and go.sum first to use Docker cache for dependency installation
COPY go.mod go.sum ./

# Download and install dependencies
RUN go mod download

# Copy the rest of the application code
COPY . .

# Build the Go application
RUN go build -o api .

# Expose the application port
EXPOSE 8000

# Start the application
CMD ["./api"]
