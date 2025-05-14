import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table"; // Assuming path is correct

import Badge from "../ui/badge/Badge"; // Assuming path is correct

import {
  CalendarIcon,
  ClockIcon,
  TrashIcon,
  DocumentTextIcon, // Using DocumentTextIcon for one-off tasks
  LockClosedIcon,   // Borrowing LockClosedIcon for constraints visual consistency
} from "@heroicons/react/24/outline";
import Button from "../ui/button/Button"; // Assuming path is correct

// Interface for One-Off Task data
interface OneOffTask {
  id?: number;
  one_off_task_id?: number;
  task_id?: number;
  user_id?: number;
  deadline: string;
  duration_minutes: number;
  category_id: number | null;
  constraint: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// Helper function to reliably get the ID
const getTaskId = (task: OneOffTask): number | undefined => {
  return task.id ?? task.one_off_task_id ?? task.task_id;
};

// Helper function to format date and time
const formatDateTime = (dateTimeString: string): string => {
  if (!dateTimeString) return "Invalid Date";
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    }).format(date);
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Invalid Date";
  }
};

// Helper function to format duration
const formatDuration = (minutes: number): string => {
    if (typeof minutes !== 'number' || isNaN(minutes) || minutes < 0) return "Invalid Duration";
    if (minutes === 0) return "0 min";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    let result = "";
    if (hours > 0) result += `${hours} hr`;
    if (mins > 0) result += (hours > 0 ? " " : "") + `${mins} min`;
    return result;
};

// Constraint types
const constraintTypes: Record<string, { label: string; color: string }> = {
  hard: { label: "Hard Deadline", color: "error" },
  soft: { label: "Soft Deadline", color: "success" },
  "": { label: "No Constraints", color: "default" },
};

export default function OneOffTasksTable() {
  const [oneOffTasks, setOneOffTasks] = useState<OneOffTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchOneOffTasks = async () => {
    // Reset state
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`api/oneofftasks`, {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText || 'Failed to fetch'}`);
      }

      const data = await response.json();
      console.log("API Response (One-Off Tasks):", data);

      // Data extraction logic (same as before)
      let tasks: OneOffTask[] = [];
      if (Array.isArray(data)) {
        tasks = data;
      } else if (data && typeof data === 'object') {
        if (data.tasks && Array.isArray(data.tasks)) tasks = data.tasks;
        else if (data.oneOffTasks && Array.isArray(data.oneOffTasks)) tasks = data.oneOffTasks;
        else if (data.one_off_tasks && Array.isArray(data.one_off_tasks)) tasks = data.one_off_tasks;
        else {
           const potentialTasks = Object.values(data).flat();
           if (Array.isArray(potentialTasks) && potentialTasks.length > 0 && potentialTasks.every(t => typeof t === 'object' && t !== null && 'deadline' in t)) {
             tasks = potentialTasks as OneOffTask[];
             console.warn("Used fallback extraction for API response format.", data);
           } else {
             throw new Error("Received data in an unexpected format.");
           }
        }
      } else {
         throw new Error("Received invalid data type from API.");
      }

      const validTasks = tasks.filter(task => task && typeof task === 'object' && 'deadline' in task && 'duration_minutes' in task && 'title' in task);
       if(validTasks.length !== tasks.length) {
          console.warn("Some items in the API response were filtered out due to missing required fields.");
      }
      setOneOffTasks(validTasks);

    } catch (err: any) {
      console.error("Failed to fetch one-off tasks:", err);
      setError(`Failed to load one-off tasks: ${err.message || 'Please try again later.'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOneOffTasks();
  }, []);

  // Function to handle task deletion (same as before)
  const handleDeleteTask = async (taskId: number) => {
    if (!taskId) {
      console.error("Cannot delete task: ID is missing.");
      alert("Cannot delete task: Task ID is missing.");
      return;
    }
    setDeleting(taskId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`api/oneofftasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete task: ${response.status} - ${errorText || 'Server error'}`);
      }
      setOneOffTasks((prev) => prev.filter((task) => getTaskId(task) !== taskId));
      console.log(`Successfully deleted task with ID: ${taskId}`);
    } catch (err: any) {
      console.error("Error deleting task:", err);
      alert(`Failed to delete task: ${err.message || 'Please try again.'}`);
    } finally {
      setDeleting(null);
    }
  };

  // Get constraint display info (same as before)
  const getConstraintInfo = (constraint: string | null | undefined) => {
    const key = constraint?.toLowerCase() || "";
    return constraintTypes[key] || {
      label: constraint || "No Constraints",
      color: "default",
    };
  };

  if (loading) {
    return <div className="p-6 text-center">Loading one-off tasks...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  if (!oneOffTasks.length) {
    return <div className="p-6 text-center">No one-off tasks found.</div>;
  }

  // Apply combined container styles
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Add vertical scroll within the bordered container */}
      <div className="overflow-y-auto max-h-[70vh]">
        {/* Horizontal scroll wrapper */}
        <div className="max-w-full overflow-x-auto">
          {/* Minimum width for table layout */}
          <div className="min-w-[1100px]">
            <Table>
              {/* Table Header - Apply RecurringTasksTable Styling */}
              <TableHeader className="sticky top-0 z-10 border-b border-gray-100 dark:border-white/[0.05] bg-gray-50 dark:bg-gray-800">
                 {/* Header Row needs explicit background if sticky */}
                <TableRow>
                  <TableCell
                    isHeader
                    className="text-theme-xs px-4 py-3 text-start font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Title & ID
                  </TableCell>
                  <TableCell
                    isHeader
                    className="text-theme-xs px-4 py-3 text-start font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Description
                  </TableCell>
                  <TableCell
                    isHeader
                    className="text-theme-xs px-4 py-3 text-start font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Deadline
                  </TableCell>
                  <TableCell
                    isHeader
                    className="text-theme-xs px-4 py-3 text-start font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Duration
                  </TableCell>
                  <TableCell
                    isHeader
                    className="text-theme-xs px-4 py-3 text-start font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Constraint
                  </TableCell>
                  <TableCell
                    isHeader
                    className="text-theme-xs px-4 py-3 text-start font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Category
                  </TableCell>
                  <TableCell
                    isHeader
                    className="text-theme-xs px-4 py-3 text-start font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              {/* Table Body - Apply RecurringTasksTable Styling */}
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {oneOffTasks.map((task, index) => {
                  const taskId = getTaskId(task);
                  const constraintInfo = getConstraintInfo(task.constraint);
                  return (
                    <TableRow key={taskId ?? `task-${index}`} className="hover:bg-gray-50 dark:hover:bg-white/[0.01]">
                      {/* Title & ID Cell - Styled like RecurringTasksTable */}
                      <TableCell className="px-4 py-3 text-start"> {/* Use px-4 py-3 */}
                        <div className="flex items-center gap-3">
                          {/* Icon styled like RecurringTasksTable */}
                          <div className="bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full">
                            <DocumentTextIcon className="text-primary h-6 w-6" />
                          </div>
                          <div>
                            {/* Text styled like RecurringTasksTable */}
                            <span className="text-theme-sm block font-medium text-gray-800 dark:text-white/90">
                              {task.title || "Untitled Task"}
                            </span>
                            <span className="text-theme-xs block text-gray-500 dark:text-gray-400">
                              ID: {taskId ?? 'N/A'}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Description Cell - Styled like RecurringTasksTable */}
                      <TableCell className="text-theme-sm max-w-xs px-4 py-3 text-start text-gray-500 dark:text-gray-400">
                        {/* Using line-clamp for better multi-line preview */}
                        <p className="line-clamp-2" title={task.description || ''}>
                            {task.description || <span className="italic text-xs">No description</span>}
                        </p>
                      </TableCell>

                      {/* Deadline Cell - Styled like RecurringTasksTable Time Cell */}
                      <TableCell className="text-theme-sm px-4 py-3 text-start text-gray-500 dark:text-gray-400">
                         <div className="flex items-center gap-2"> {/* Use gap-2 */}
                              <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span>{formatDateTime(task.deadline)}</span>
                         </div>
                      </TableCell>

                      {/* Duration Cell - Styled like RecurringTasksTable Time Cell */}
                      <TableCell className="text-theme-sm px-4 py-3 text-start text-gray-500 dark:text-gray-400">
                         <div className="flex items-center gap-2"> {/* Use gap-2 */}
                              <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span>{formatDuration(task.duration_minutes)}</span>
                          </div>
                      </TableCell>

                      {/* Constraint Cell - Styled like RecurringTasksTable Constraint Cell */}
                      <TableCell className="text-theme-sm px-4 py-3 text-start text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2"> {/* Use gap-2 */}
                            <LockClosedIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <Badge
                                size="sm"
                                color={constraintInfo.color as any} // Cast if needed
                            >
                                {constraintInfo.label}
                            </Badge>
                        </div>
                      </TableCell>

                      {/* Category Cell - Styled like RecurringTasksTable Category Cell */}
                      <TableCell className="text-theme-sm px-4 py-3 text-start text-gray-500 dark:text-gray-400">
                          {task.category_id ? (
                          <Badge size="sm" color="info">
                              Category #{task.category_id}
                          </Badge>
                          ) : (
                          // Matching "No category" style
                          <span className="text-sm text-gray-400">No category</span>
                          )}
                      </TableCell>

                      {/* Actions Cell - Styled like RecurringTasksTable Actions Cell */}
                      <TableCell className="px-4 py-3 text-start"> {/* Use px-4 py-3 */}
                         <Button
                              variant="destructive"
                              size="sm"
                              disabled={deleting === taskId || !taskId}
                              onClick={() => {
                                  if (!taskId) {
                                      alert("Cannot delete task: Task ID is missing.");
                                      return;
                                  }
                                  if (window.confirm(`Are you sure you want to delete task "${task.title || 'Untitled'}" (ID: ${taskId})?`)) {
                                       handleDeleteTask(taskId);
                                  }
                              }}
                              // Use flex gap-2 like RecurringTasksTable
                              className="flex items-center gap-2"
                          >
                              <TrashIcon className="h-4 w-4" />
                              {deleting === taskId ? 'Deleting...' : 'Delete'}
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
    </div>
  );
}