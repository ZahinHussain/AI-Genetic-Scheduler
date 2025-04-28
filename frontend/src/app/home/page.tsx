"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const HomePage: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        // First try to get user from localStorage
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // Verify authentication with the server
        const response = await fetch("/api/auth/me", {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
            localStorage.setItem("user", JSON.stringify(data.user));
          }
        } else {
          // Not authenticated, redirect to login
          router.push("/signin");
        }
      } catch (error) {
        console.error("Authentication error:", error);
        router.push("/signin");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // Clear local storage
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");

      // Redirect to login
      router.push("/signin");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <h1>Home</h1>
    </div>
  );
};

// Component to test the server ping
const ServerPingTest: React.FC = () => {
  const [pingResponse, setPingResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePing = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ping");
      if (response.ok) {
        const data = await response.json();
        setPingResponse(data.message);
      } else {
        const textResponse = await response.text();
        setPingResponse(`Failed: ${response.status} - ${textResponse}`);
      }
    } catch (error) {
      console.error("Error:", error);
      setPingResponse(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        onClick={handlePing}
        className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
      >
        Test Connection
      </button>
      {isLoading && (
        <span className="ml-2 text-sm text-gray-600">Testing...</span>
      )}
      {pingResponse && (
        <div className="mt-1 text-sm text-gray-800">{pingResponse}</div>
      )}
    </div>
  );
};

export default HomePage;
