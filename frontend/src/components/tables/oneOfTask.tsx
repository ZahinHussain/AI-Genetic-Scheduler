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
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import Button from "../ui/button/Button";

// Update interface to account for different possible ID field names
interface OneOffTask {
  id?: number;
  one_off_task_id?: number; // Add this field - API might be using this naming
  task_id?: number; // Add this field - API might be using this naming
  deadline: string;
  duration_minutes: number;
  category_id: number | null;
  constraint: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// Helper function to get the ID from a task, regardless of field name
const getTaskId = (task: OneOffTask): number | undefined => {
  try {
    if (task.id) return task.id;

    if (task.one_off_task_id) return task.one_off_task_id;
    if (task.task_id) return task.task_id;
  } catch (error) {
    console.error("Error getting task ID:", error);
  }
};

// Helper function to format date and time
const formatDateTime = (dateTimeString: string): string => {
  const date = new Date(dateTimeString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

// Helper function to format duration in hours and minutes
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} min`;
  } else if (mins === 0) {
    return `${hours} hr`;
  } else {
    return `${hours} hr ${mins} min`;
  }
};

// Common constraint types to display more user-friendly labels
const constraintTypes: Record<string, { label: string; color: string }> = {
  hard: { label: "Hard Constraint", color: "error" },
  soft: { label: "Soft Constraint", color: "success" },
  "": { label: "No Constraints", color: "default" },
};

// Sample test data in case the API fails

export default function OneOffTasksTable() {
  const [oneOffTasks, setOneOffTasks] = useState<OneOffTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null); // Store the raw API response for debugging

  const fetchOneOffTasks = async () => {
    try {
      setLoading(true);

      // Get JWT token from localStorage
      const token = localStorage.getItem("token");

      // Making the API request
      const response = await fetch(`api/oneofftasks`, {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(`API Error: Status ${response.status}`);
        // Try to get the error message from the response
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("API Response:", data); // Log the response for debugging
      setApiResponse(data); // Store the raw response for debugging

      // Process the response based on its structure
      if (data && Array.isArray(data)) {
        setOneOffTasks(data);
      } else if (data && typeof data === "object") {
        // If the response is an object with tasks as properties or in a nested structure
        if (data.tasks && Array.isArray(data.tasks)) {
          setOneOffTasks(data.tasks);
        } else if (data.oneOffTasks && Array.isArray(data.oneOffTasks)) {
          setOneOffTasks(data.oneOffTasks);
        } else if (data.one_off_tasks && Array.isArray(data.one_off_tasks)) {
          setOneOffTasks(data.one_off_tasks);
        } else {
          // Try to extract tasks from the object
          const tasks = Object.values(data).flat();
          if (Array.isArray(tasks) && tasks.length > 0) {
            setOneOffTasks(tasks as OneOffTask[]);
          } else {
            console.warn("Unexpected response format", data);
          }
        }
      } else {
        console.warn("Unexpected response format", data);
      }
    } catch (err) {
      console.error("Failed to fetch one-off tasks:", err);
      setError("Failed to load one-off tasks. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOneOffTasks();
  }, []);

  // Function to handle task deletion
  const handleDeleteTask = async (taskId: number) => {
    try {
      setDeleting(taskId);
      console.log("Deleting task with ID:", taskId);

      // Get JWT token from localStorage
      const token = localStorage.getItem("token");

      const response = await fetch(`api/oneofftasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.status}`);
      }

      // Remove deleted task from state, considering all possible ID field names
      setOneOffTasks((prev) =>
        prev.filter((task) => getTaskId(task) !== taskId),
      );

      // Optional: Show success notification
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Failed to delete task. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  // Get constraint display info
  const getConstraintInfo = (constraint: string) => {
    return (
      constraintTypes[constraint] || {
        label: constraint || "No Constraints",
        color: "default",
      }
    );
  };

  if (loading) {
    return <div className="p-6 text-center">Loading one-off tasks...</div>;
  }

  if (error && oneOffTasks.length === 0) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  if (oneOffTasks.length != 0)
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        Add a Task then it will appear.
      </div>
    );
  else {
    return (
      // Adjust max-h-[70vh] (70% of viewport height) or use a fixed pixel value like max-h-[600px]
      <div className="max-h-[70vh] overflow-y-auto rounded-lg border border-gray-200 shadow-sm dark:border-gray-700">
        {/* Existing wrapper for horizontal scrolling */}
        <div className="max-w-full overflow-x-auto">
          {/* Apply min-width to ensure table layout consistency */}
          <div className="inline-block min-w-[1100px] align-middle">
            <Table>
              {/* Table Header */}
              <TableHeader>
                {/* *** MODIFIED: Added sticky classes and background to TableRow *** */}
                <TableRow className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                  <TableCell
                    isHeader
                    // Use bg-inherit if you want cell background to match row exactly,
                    // or specify the same bg as the row for consistency.
                    className="px-5 py-3 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300"
                  >
                    Title & ID
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300"
                  >
                    Description
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300"
                  >
                    Deadline
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300"
                  >
                    Duration
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300"
                  >
                    Constraint
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300"
                  >
                    Category
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-300"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              {/* Table Body */}
              <TableBody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {oneOffTasks.map((task, index) => {
                  const taskId = getTaskId(task);
                  const constraintInfo = getConstraintInfo(task.constraint); // Get constraint info once
                  return (
                    <TableRow
                      key={taskId || `task-${index}`}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      {/* Title & ID Cell */}
                      <TableCell className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary-100 dark:bg-primary-900 flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full">
                            <DocumentTextIcon className="text-primary-600 dark:text-primary-400 h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {task.title || "Untitled Task"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {taskId ?? "N/A"}{" "}
                              {/* Use nullish coalescing */}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Description Cell */}
                      <TableCell className="max-w-xs px-5 py-4">
                        {" "}
                        {/* Allow wrapping */}
                        <p
                          className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300"
                          title={task.description}
                        >
                          {" "}
                          {/* Limit lines, show full on hover */}
                          {task.description || (
                            <span className="text-gray-400 italic">
                              No description
                            </span>
                          )}
                        </p>
                      </TableCell>

                      {/* Deadline Cell */}
                      <TableCell className="px-5 py-4 text-sm whitespace-nowrap text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          <span>{formatDateTime(task.deadline)}</span>
                        </div>
                      </TableCell>

                      {/* Duration Cell */}
                      <TableCell className="px-5 py-4 text-sm whitespace-nowrap text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1.5">
                          <ClockIcon className="h-4 w-4 text-gray-400" />
                          <span>{formatDuration(task.duration_minutes)}</span>
                        </div>
                      </TableCell>

                      {/* Constraint Cell */}
                      <TableCell className="px-5 py-4 text-sm whitespace-nowrap">
                        <Badge
                          size="sm"
                          color={constraintInfo.color as any} // Cast if necessary for your Badge component
                        >
                          {constraintInfo.label}
                        </Badge>
                      </TableCell>

                      {/* Category Cell */}
                      <TableCell className="px-5 py-4 text-sm whitespace-nowrap">
                        {task.category_id ? (
                          <Badge size="sm" color="info">
                            {/* You might want to fetch category names later */}
                            Category #{task.category_id}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            None
                          </span>
                        )}
                      </TableCell>

                      {/* Actions Cell */}
                      <TableCell className="px-5 py-4 text-sm font-medium whitespace-nowrap">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleting === taskId || !taskId} // Disable if no ID or deleting
                          onClick={() => {
                            if (!taskId) {
                              alert("Cannot delete task: Task ID is missing.");
                              return;
                            }
                            if (
                              window.confirm(
                                `Are you sure you want to delete task "${task.title}" (ID: ${taskId})?`,
                              )
                            ) {
                              handleDeleteTask(taskId);
                            }
                          }}
                          className="inline-flex items-center gap-1.5" // Use inline-flex
                        >
                          <TrashIcon className="h-4 w-4" />
                          {deleting === taskId ? "Deleting..." : "Delete"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  }
}
