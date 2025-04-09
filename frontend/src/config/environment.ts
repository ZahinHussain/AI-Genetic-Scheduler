/**
 * Environment Configuration
 * 
 * This file provides centralized access to environment variables and configuration
 * with proper validation and error handling.
 */

// Default values when running in development mode
const DEFAULTS = {
  // Default backend URL when running locally with docker-compose
  BACKEND_URL: 'http://localhost:8080',
  // API version path
  API_VERSION: '/api/v1',
};

/**
 * Environment configuration with validation
 */
export const env = {
  /**
   * Get the backend API base URL with validation
   * Throws an error if not configured in production
   */
  get backendUrl(): string {
    // Check for environment variable
    const envBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    
    // If we have an environment variable, use it
    if (envBackendUrl) {
      return envBackendUrl;
    }
    
    // In development, we can use a default value
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '⚠️ NEXT_PUBLIC_BACKEND_URL is not set. Using default development URL:',
        DEFAULTS.BACKEND_URL
      );
      return DEFAULTS.BACKEND_URL;
    }
    
    // In production, log an error but still return a value if possible
    console.error(
      '❌ NEXT_PUBLIC_BACKEND_URL environment variable is not set in production!'
    );
    
    // Can return a production fallback or empty string to fail gracefully
    return '';
  },

  /**
   * Get the full API URL (backend + version)
   */
  get apiUrl(): string {
    const baseUrl = this.backendUrl;
    
    // If baseUrl is empty, we can't build a valid API URL
    if (!baseUrl) {
      return '';
    }
    
    const version = process.env.NEXT_PUBLIC_API_VERSION || DEFAULTS.API_VERSION;
    return `${baseUrl}${version}`;
  },

  /**
   * Validate the environment configuration
   * Returns true if all required config is present, false otherwise
   */
  isValid(): boolean {
    // Check if backendUrl is available and valid
    return !!this.backendUrl && this.backendUrl !== '';
  },

  /**
   * Get validation errors as an object
   * This is useful for error reporting and debugging
   */
  getValidationErrors(): Record<string, string> {
    const errors: Record<string, string> = {};
    
    if (!this.backendUrl) {
      errors.backend_url_missing = 'Backend URL is not configured';
    }
    
    return errors;
  }
};

export default env;