/**
 * API URL Utilities
 */

// Base API URL - make sure this matches your backend server
const BASE_API_URL = "http://localhost:8080"; // Update this to match your Go server

/**
 * Builds a complete API URL from a path
 * @param path - API endpoint path
 * @returns Full API URL
 */
export const buildApiUrl = (path: string): string => {
  // Ensure path starts with a slash
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // Remove trailing slash from base URL if it exists
  const normalizedBase = BASE_API_URL.endsWith("/")
    ? BASE_API_URL.slice(0, -1)
    : BASE_API_URL;

  return `${normalizedBase}${normalizedPath}`;
};

/**
 * Debug utility to test API connection
 */
export const testApiConnection = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const response = await fetch(buildApiUrl("/ping"));
    if (!response.ok) {
      return {
        success: false,
        message: `Server responded with status: ${response.status}`,
      };
    }
    const data = await response.json();
    return {
      success: true,
      message: `Connection successful! Server says: ${data.message}`,
    };
  } catch (error) {
    console.error("API connection test failed:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
