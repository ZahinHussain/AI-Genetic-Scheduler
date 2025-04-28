"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Define the User type
export interface User {
  userID: number;
  email: string;
  createdAt?: string;
}

// Define the AuthContext shape
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

// AuthProvider props
interface AuthProviderProps {
  children: ReactNode;
}

// Create the AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to set the user and token
  const login = (token: string, user: User) => {
    if (token) {
      // Only store in localStorage if we want token persistence across browser sessions
      // Otherwise, the cookie handles authentication
      localStorage.setItem("auth_token", token);
    }

    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  // Function to log out
  const logout = async () => {
    try {
      // Call logout endpoint to clear the cookie
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // Clear local storage and state
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      setUser(null);

      // Optional: redirect to login page
      // window.location.href = '/signin';
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Function to refresh user data from the server
  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
          setUser(data.user);
        }
      } else {
        // If unauthorized, clear user state
        setUser(null);
        localStorage.removeItem("user");
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing user session on load
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);

      try {
        // First try to get the user from localStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // Then verify with the server (JWT in cookie)
        await refreshUser();
      } catch (error) {
        console.error("Authentication check error:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Context value
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using the auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
