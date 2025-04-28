"use client"; // Required for hooks like useState and onClick handlers in Next.js App Router

import React, { useState } from "react";
import Link from "next/link"; // Use Link for internal navigation

const LandingPage: React.FC = () => {
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [isLoadingPing, setIsLoadingPing] = useState(false);

  // Function to handle the ping request
  const handlePing = async () => {
    setIsLoadingPing(true);
    setPingStatus(null); // Reset status
    try {
      // Assume you have a public ping endpoint at /api/ping
      // If not, you'll need to create one on your backend.
      const response = await fetch("/api/ping");
      const responseTime = Date.now(); // Capture time immediately after response

      if (response.ok) {
        const data = await response.json();
        // Calculate latency roughly if possible or just show success
        setPingStatus(data.message || "Pong! Server is responsive.");
      } else {
        setPingStatus(`Error: Server responded with status ${response.status}`);
      }
    } catch (error) {
      console.error("Ping error:", error);
      setPingStatus("Error: Could not connect to the server.");
    } finally {
      setIsLoadingPing(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-50 to-gray-100 text-gray-800 dark:from-gray-900 dark:to-gray-800 dark:text-gray-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm dark:bg-gray-800">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex flex-shrink-0 items-center">
              {/* You could add an SVG logo here */}
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                Chronomind
              </span>
            </div>

            {/* Login Button */}
            <div className="flex items-center">
              <Link
                href="/signin" // Make sure this path matches your login page route
                className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Login
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex flex-grow flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          <span className="block text-gray-900 dark:text-white">
            Intelligent Scheduling
          </span>
          <span className="block text-blue-600 dark:text-blue-400">
            Powered by Genetics
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base text-gray-500 sm:text-lg md:mt-5 md:max-w-3xl md:text-xl dark:text-gray-400">
          Chronomind uses genetic algorithms to optimize complex schedules,
          finding efficient solutions faster.
        </p>

        {/* Ping Button and Status */}
        <div className="mt-8 flex flex-col items-center space-y-4">
          <button
            onClick={handlePing}
            disabled={isLoadingPing}
            className={`rounded-md border border-transparent px-6 py-3 text-base font-medium text-white shadow-sm ${
              isLoadingPing
                ? "cursor-not-allowed bg-gray-400"
                : "bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
            } dark:bg-green-500 dark:hover:bg-green-600`}
          >
            {isLoadingPing ? "Pinging..." : "Ping Server"}
          </button>

          {/* Display Ping Status */}
          {pingStatus && (
            <p
              className={`mt-2 text-sm ${pingStatus.startsWith("Error") ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-300"}`}
            >
              {pingStatus}
            </p>
          )}
        </div>
      </main>

      {/* Footer (Optional) */}
      <footer className="mt-12 bg-white py-4 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500 sm:px-6 lg:px-8 dark:text-gray-400">
          © {new Date().getFullYear()} Chronomind. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
