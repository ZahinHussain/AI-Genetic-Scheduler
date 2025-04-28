/**
 * Authentication utility functions
 */

// Get the current token either from localStorage or cookie
export const getAuthToken = (): string | null => {
  return localStorage.getItem("auth_token");
};

// Generic function to make authenticated API requests
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  // Get token from localStorage (if it exists)
  const token = getAuthToken();

  // Prepare headers
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Make the request with credentials to include cookies
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Important: always include cookies
  });

  return response;
};

// Detect if token is expired (typically handled by the backend)
export const isTokenExpired = () => {
  const token = getAuthToken();
  if (!token) return true;

  try {
    // JWT tokens consist of three parts: header.payload.signature
    const payload = token.split(".")[1];
    // Decode the base64 string
    const decoded = JSON.parse(atob(payload));
    // Check if the token is expired
    const exp = decoded.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch (e) {
    console.error("Error checking token expiration:", e);
    return true;
  }
};

// Parse the user from local storage
export const getStoredUser = () => {
  const userJson = localStorage.getItem("user");
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch (e) {
    console.error("Error parsing stored user:", e);
    return null;
  }
};
