import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";

import {
  CalendarIcon,
  ClockIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Button from "../ui/button/Button";

// Interface for calendar entries
interface Calendar {
  calendar_id: number;
  user_id: number;
  GAGeneration_id: number;
  start_date: string;
  created_at: string;
}

// Helper Functions
const formatDate = (dateString: string | null): string => {
  if (!dateString) return "No date";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export default function ManageSchedule() {
  // Internal state management
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch calendar entries from API
  const fetchCalendars = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/calendar/ga`, {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
      });

      if (!response.ok)
        throw new Error(
          `API Error: ${response.status} - ${await response.text()}`,
        );

      const data = await response.json();
      console.log("Calendar data received:", data);

      // Handle different response structures
      if (data && Array.isArray(data.calendar_tasks)) {
        setCalendars(data.calendar_tasks);
      } else if (data && Array.isArray(data.calendar_entries)) {
        setCalendars(data.calendar_entries);
      } else if (Array.isArray(data)) {
        setCalendars(data);
      } else {
        console.warn("Unexpected API response structure:", data);
        setCalendars([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch calendar entries:", err);
      setFetchError(`Failed to load calendar entries: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendars();
  }, []);

  // Delete Handler for a single calendar entry
  const handleDeleteCalendar = async (calendarId: number) => {
    // Confirmation dialog
    if (
      !window.confirm(
        `Are you sure you want to delete this calendar entry? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setDeletingId(calendarId);
    const token = localStorage.getItem("token");

    try {
      console.log(`Deleting calendar ID: ${calendarId}`);

      const response = await fetch(`/api/calendar`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify({ calendar_id: calendarId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to delete calendar ID ${calendarId}:`, errorText);
        throw new Error(`Failed to delete: ${errorText}`);
      }

      // Remove deleted calendar from local state
      setCalendars((currentCalendars) =>
        currentCalendars.filter(
          (calendar) => calendar.calendar_id !== calendarId,
        ),
      );

      // Success message
      console.log("Calendar entry deleted successfully:", calendarId);
    } catch (err: any) {
      console.error("Failed to delete calendar entry:", err);
      alert(
        `Failed to delete calendar entry: ${err.message}. Please try again.`,
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Retry handler for fetch errors
  const handleRetry = () => {
    fetchCalendars();
  };

  // Render States
  if (loading)
    return (
      <div className="flex items-center justify-center p-10">
        <p>Loading calendar entries...</p>
      </div>
    );

  if (fetchError)
    return (
      <div className="p-6 text-center">
        <div className="mb-4 text-red-500">{fetchError}</div>
        <Button onClick={handleRetry} variant="primary" size="sm">
          Retry
        </Button>
      </div>
    );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]"></div>

      {/* Table */}
      {calendars.length === 0 && !loading && (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          <p>No calendar entries found.</p>
          <Button
            onClick={fetchCalendars}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            Refresh
          </Button>
        </div>
      )}
      {calendars.length > 0 && (
        <div className="overflow-hidden rounded-b-xl border border-t-0 border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[1102px]">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                    >
                      ID & Generation
                    </TableCell>
                    <TableCell
                      isHeader
                      className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                    >
                      Start Date
                    </TableCell>
                    <TableCell
                      isHeader
                      className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                    >
                      Created
                    </TableCell>
                    <TableCell
                      isHeader
                      className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {calendars.map((calendar) => (
                    <TableRow
                      key={calendar.calendar_id}
                      className={`hover:bg-gray-50 dark:hover:bg-white/[0.02] ${deletingId === calendar.calendar_id ? "opacity-50" : ""}`}
                    >
                      <TableCell className="px-5 py-4 text-start sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full">
                            <CalendarIcon className="text-primary h-6 w-6" />
                          </div>
                          <div>
                            <span className="text-theme-sm block font-medium text-gray-800 dark:text-white/90">
                              Calendar Entry
                            </span>
                            <span className="text-theme-xs block text-gray-500 dark:text-gray-400">
                              ID: {calendar.calendar_id} | Generation:{" "}
                              {calendar.GAGeneration_id}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-theme-sm px-4 py-3 text-start text-gray-500 dark:text-gray-400">
                        <Badge size="sm">
                          {formatDate(calendar.start_date)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-theme-sm px-4 py-3 text-start text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-gray-400" />
                          <span>{formatDate(calendar.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === calendar.calendar_id}
                          onClick={() =>
                            handleDeleteCalendar(calendar.calendar_id)
                          }
                          className="flex items-center gap-2"
                        >
                          <TrashIcon className="h-4 w-4" />
                          {deletingId === calendar.calendar_id
                            ? "Deleting..."
                            : "Delete"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
