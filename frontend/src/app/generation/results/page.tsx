
import React from "react";
import { Metadata } from "next";

// Component Imports (Grouped)
import Calendar from "@/components/calendar/Calendar";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

// --- Metadata ---
// Defines SEO and other metadata for the page
export const metadata: Metadata = {
  title: "Calendar | TailAdmin - Next.js Dashboard", // Simplified title
  description:
    "Interactive calendar page within the TailAdmin Next.js dashboard.",
  // other metadata if needed
};

// --- Page Component ---
// Uses PascalCase convention for component names
export default function CalendarPage() {
  // --- State & Logic (Placeholder Handlers) ---
  // TODO: Implement actual logic for these handlers


  // --- Render ---
  return (
    // Main container: Full height, column layout
    <div className="flex h-full flex-col"> {/* Use h-full if parent provides height, or h-screen if it should fill viewport */}

      {/* Breadcrumb Navigation */}
      <PageBreadcrumb pageTitle="Calendar" />

      {/* Calendar Area: Takes remaining space and scrolls if needed */}
      <div className="flex-grow overflow-auto p-4 md:p-6"> {/* Added responsive padding */}
        <Calendar />
      </div>

      {/* Action Buttons Area */}
      <div className="flex justify-end space-x-4 border-t border-gray-200 p-4 dark:border-gray-700"> {/* Added border, padding, alignment */}
        {/* Regenerate Button */}
        <button
   
          type="button" // Explicitly set type for buttons
          className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75" // Added focus styles, adjusted padding/text size
        >
          Regenerate Schedule
        </button>

        {/* Add to Calendar Button */}
        <button
   
          type="button" // Explicitly set type for buttons
          className="rounded bg-green-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75" // Added focus styles, adjusted padding/text size
        >
          Add to My Calendar
        </button>
      </div>
    </div>
  );
}