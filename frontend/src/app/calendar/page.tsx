"use client"; // ← VERY IMPORTANT

import Calendar from "@/components/calendar/Calendar";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

import React, { useEffect, useState } from "react";

export default function CalendarPage() {
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        console.log("Fetching calendar data...");
        const response = await fetch("/api/calendar", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("Fetch response status:", response.status);

        if (!response.ok) {
          throw new Error(`Error fetching calendar data: ${response.status}`);
        }

        const rawData = await response.json();
        console.log("Raw API response:", rawData);

        // Handle the case where the API returns an object with calendar_tasks array
        let eventsArray = [];

        if (
          rawData &&
          rawData.calendar_tasks &&
          Array.isArray(rawData.calendar_tasks)
        ) {
          // The data has a calendar_tasks property which is an array
          console.log(
            "Found calendar_tasks array with",
            rawData.calendar_tasks.length,
            "events",
          );
          eventsArray = rawData.calendar_tasks;
        } else if (Array.isArray(rawData)) {
          // The data is already an array
          console.log("API returned an array with", rawData.length, "events");
          eventsArray = rawData;
        } else if (rawData && typeof rawData === "object") {
          // The data is a single object, wrap it in an array
          console.log("API returned a single object, wrapping in array");
          eventsArray = [rawData];
        } else {
          console.warn("Unexpected API response format:", rawData);
          eventsArray = [];
        }

        console.log("Processed events array:", eventsArray);

        // Validate the events have required properties
        const validEvents = eventsArray.filter((event) => {
          if (!event.scheduled_start || !event.scheduled_end || !event.title) {
            console.warn("Event missing required properties:", event);
            return false;
          }
          return true;
        });

        console.log("Valid events after filtering:", validEvents.length);
        setCalendarData(validEvents);
      } catch (err: any) {
        console.error("Error in fetchCalendar:", err);
        setError(err.message || "Failed to fetch calendar data");
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
  }, []);

  console.log("Calendar page rendering with data:", calendarData);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="border-brand-500 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Loading calendar...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center dark:bg-red-900/20">
        <p className="text-red-600 dark:text-red-400">
          Error loading calendar: {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-brand-500 hover:bg-brand-600 mt-4 rounded-md px-4 py-2 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Calendar" />
      {calendarData && calendarData.length > 0 ? (
        <Calendar data={calendarData} />
      ) : (
        <div className="rounded-lg bg-gray-50 p-6 text-center dark:bg-gray-900/20">
          <p className="text-gray-600 dark:text-gray-300">
            No calendar events found.
          </p>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Try adding events or check your API endpoint.
          </p>
        </div>
      )}

      <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-500 dark:bg-gray-800/50">
        <p>Debug Info: Found {calendarData?.length || 0} valid events</p>
      </div>
    </div>
  );
}
