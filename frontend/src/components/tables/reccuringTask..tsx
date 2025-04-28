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
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import Button from "../ui/button/Button";
// If you have issues with Heroicons, uncomment this alternative
// import { FiCalendar, FiClock, FiTrash2, FiLock } from "react-icons/fi";

interface RecurringTask {
  recurring_task_id: number;
  user_id: number;
  start_date: string;
  end_date: string;
  event_start_time: string;
  event_end_time: string;
  category_id: number | null;
  constraint: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// Helper function to format time (HH:MM:SS to HH:MM AM/PM)
const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(":");
  const hoursNum = parseInt(hours);
  const period = hoursNum >= 12 ? "PM" : "AM";
  const hours12 = hoursNum % 12 || 12;
  return `${hours12}:${minutes} ${period}`;
};

// Helper function to format date

// Common constraint types to display more user-friendly labels
const constraintTypes: Record<string, { label: string; color: string }> = {
  fixed: { label: "Fixed Time", color: "error" },
  flexible: { label: "Flexible", color: "success" },
  preferred: { label: "Preferred Time", color: "warning" },
  avoid: { label: "Avoid Time", color: "dark" },
  priority: { label: "High Priority", color: "primary" },
  "": { label: "No Constraints", color: "default" },
};

export default function RecurringTasksTable() {
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchRecurringTasks = async () => {
    try {
      setLoading(true);

      // Get JWT token from localStorage
      const token = localStorage.getItem("token");

      // Making the API request with proper CORS handling
      const response = await fetch(`api/recurringtasks`, {
        method: "GET",
        // Don't include credentials if you're sending Bearer token
        // credentials: 'include',
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        // Don't set custom CORS headers in the client request
        // The server should handle CORS properly
      });

      if (!response.ok) {
        console.error(`API Error: Status ${response.status}`);
        // Try to get the error message from the response
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("API Response:", data); // Log the response for debugging

      // Check if the response has the expected structure
      if (data && Array.isArray(data.recurring_tasks)) {
        setRecurringTasks(data.recurring_tasks);
      } else if (data && typeof data === "object") {
        // If the response is an object with recurring tasks directly
        const tasks = Object.values(data).flat();

        console.warn("Unexpected response format", data);
      } else {
        console.warn("Unexpected response format", data);
      }
    } catch (err) {
      console.error("Failed to fetch recurring tasks:", err);
      setError("Failed to load recurring tasks. Please try again later.");
      // Use sample data in case of API failure for testing purposes
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurringTasks();
  }, []);

  // Function to handle task deletion
  const handleDeleteTask = async (taskId: number) => {
    try {
      setDeleting(taskId);
      const baseUrlHost = process.env.NEXT_PUBLIC_API_HOST || "localhost";
      const baseUrlPort = process.env.NEXT_PUBLIC_API_PORT || "8080";

      // Get JWT token from localStorage
      const token = localStorage.getItem("token");

      const response = await fetch(`api/recurringtasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.status}`);
      }

      // Remove deleted task from state
      setRecurringTasks((prev) =>
        prev.filter((task) => task.recurring_task_id !== taskId),
      );

      // Show success message or notification here if needed
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Failed to delete task. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  // Status color based on day of week
  const getStatusColor = (day: string) => {
    const colors: Record<string, string> = {
      Mon: "success",
      Tue: "info",
      Wed: "primary",
      Thu: "warning",
      Fri: "error",
      Sat: "dark",
      Sun: "dark",
    };
    return colors[day] || "default";
  };

  // Get constraint display info
  const getConstraintInfo = (constraint: string) => {
    // Look up the constraint in our predefined types
    if (constraintTypes[constraint]) {
      return constraintTypes[constraint];
    }

    // If it's not in our predefined list, return the raw value with a default color
    return {
      label: constraint || "No Constraints",
      color: "default",
    };
  };

  if (loading) {
    return <div className="p-6 text-center">Loading recurring tasks...</div>;
  }

  if (error && recurringTasks.length === 0) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  if (!recurringTasks.length) {
    return <div className="p-6 text-center">No recurring tasks found.</div>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1102px]">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                >
                  ID & Title
                </TableCell>
                <TableCell
                  isHeader
                  className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                >
                  Description
                </TableCell>
                <TableCell
                  isHeader
                  className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                >
                  Day
                </TableCell>
                <TableCell
                  isHeader
                  className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                >
                  Time
                </TableCell>
                <TableCell
                  isHeader
                  className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                >
                  Constraints
                </TableCell>
                <TableCell
                  isHeader
                  className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                >
                  Category
                </TableCell>
                <TableCell
                  isHeader
                  className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {recurringTasks.map((task) => (
                <TableRow key={task.recurring_task_id}>
                  <TableCell className="px-5 py-4 text-start sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full">
                        <CalendarIcon className="text-primary h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-theme-sm block font-medium text-gray-800 dark:text-white/90">
                          {task.title}
                        </span>
                        <span className="text-theme-xs block text-gray-500 dark:text-gray-400">
                          ID: {task.recurring_task_id}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-theme-sm max-w-xs truncate px-4 py-3 text-start text-gray-500 dark:text-gray-400">
                    {task.description || "No description provided"}
                  </TableCell>
                  <TableCell className="text-theme-sm px-4 py-3 text-start text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">Start:</span>
                        <Badge
                          size="sm"
                          color={getStatusColor(task.start_date)}
                        >
                          {task.start_date}
                        </Badge>
                      </div>
                      {task.end_date && task.end_date !== task.start_date && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">End:</span>
                          <Badge
                            size="sm"
                            color={getStatusColor(task.end_date)}
                          >
                            {task.end_date}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-theme-sm px-4 py-3 text-start text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      <span>
                        {formatTime(task.event_start_time)} -{" "}
                        {formatTime(task.event_end_time)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-theme-sm px-4 py-3 text-start text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <LockClosedIcon className="h-4 w-4 text-gray-400" />
                      {task.constraint ? (
                        <Badge
                          size="sm"
                          color={getConstraintInfo(task.constraint).color}
                        >
                          {getConstraintInfo(task.constraint).label}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">
                          No constraints
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-theme-sm px-4 py-3 text-gray-500 dark:text-gray-400">
                    {task.category_id ? (
                      <Badge size="sm" color="info">
                        Category #{task.category_id}
                      </Badge>
                    ) : (
                      <span className="text-sm text-gray-400">No category</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleting === task.recurring_task_id}
                      onClick={() => {
                        console.log("Delete button clicked");
                        if (
                          confirm(
                            "Are you sure you want to delete this recurring task?",
                          )
                        ) {
                          handleDeleteTask(task.recurring_task_id);
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <TrashIcon className="h-4 w-4" />
                      {deleting === task.recurring_task_id
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
  );
}
