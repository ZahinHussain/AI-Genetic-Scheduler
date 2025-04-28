import React, { useEffect, useState, ChangeEvent } from "react";
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
  LockClosedIcon,
} from "@heroicons/react/24/outline";

// --- Interface for one-off tasks ---
interface OneOffTask {
  one_off_task_id: number;
  deadline: string | null;
  duration_minutes: number;
  category_id: number | null;
  constraint: string;
  title: string;
  description: string;
}

// --- Helper Functions ---
const formatDate = (dateString: string | null): string => {
  if (!dateString) return "No deadline";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const formatDuration = (minutes: number): string => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
};

const constraintTypes: Record<string, { label: string; color: string }> = {
  hard: { label: "Hard Constraint", color: "error" },
  soft: { label: "Soft Constraint", color: "success" },
  "": { label: "No Constraints", color: "default" },
};

const getConstraintInfo = (constraint: string) =>
  constraintTypes[constraint] || {
    label: constraint || "No Constraints",
    color: "default",
  };

// --- Component Props ---
interface OneOffTasksTableProps {
  selectedTaskIds: number[];
  onSelectionChange: (selectedIds: number[]) => void;
}

export default function OneOffTasksTable({
  selectedTaskIds,
  onSelectionChange,
}: OneOffTasksTableProps) {
  const [tasks, setTasks] = useState<OneOffTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch one-off tasks from API
  const fetchOneOffTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/oneofftasks`, {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
      if (!response.ok)
        throw new Error(
          `API Error: ${response.status} - ${await response.text()}`,
        );
      const data = await response.json();
      if (data && Array.isArray(data.one_off_tasks)) {
        setTasks(data.one_off_tasks);
      } else {
        console.warn(
          "Unexpected API response, expected data.one_off_tasks array",
          data,
        );
        setTasks([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch one-off tasks:", err);
      setError(`Failed to load tasks: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOneOffTasks();
  }, []);

  // --- Selection Handlers ---
  const handleSelectAll = (event: ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    if (isChecked) {
      onSelectionChange(tasks.map((task) => task.one_off_task_id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleRowSelect = (
    taskId: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const isChecked = event.target.checked;
    if (isChecked) {
      onSelectionChange([...selectedTaskIds, taskId]);
    } else {
      onSelectionChange(selectedTaskIds.filter((id) => id !== taskId));
    }
  };

  const isAllSelected =
    tasks.length > 0 && selectedTaskIds.length === tasks.length;

  // --- Render States ---
  if (loading)
    return (
      <div className="flex items-center justify-center p-10">
        <p>Loading tasks...</p>
      </div>
    );
  if (error)
    return (
      <div className="rounded-sm border border-red-400 bg-red-100 p-6 text-center text-red-500">
        {error}
      </div>
    );
  if (!tasks.length)
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        No one-off tasks found.
      </div>
    );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1102px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start"
                  style={{ width: "50px" }}
                >
                  <label htmlFor="select-all" className="sr-only">
                    Select all tasks
                  </label>
                  <input
                    id="select-all"
                    type="checkbox"
                    className="form-checkbox text-primary focus:ring-primary dark:focus:ring-primary h-4 w-4 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                </TableCell>
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
                  Deadline
                </TableCell>
                <TableCell
                  isHeader
                  className="text-theme-xs px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                >
                  Duration
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
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {tasks.map((task) => {
                const isSelected = selectedTaskIds.includes(
                  task.one_off_task_id,
                );
                const constraintInfo = getConstraintInfo(task.constraint);
                return (
                  <TableRow
                    key={task.one_off_task_id}
                    data-state={isSelected ? "selected" : ""}
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.02] dark:data-[state=selected]:bg-white/[0.06]"
                  >
                    <TableCell className="px-5 py-4 text-start">
                      <label
                        htmlFor={`select-task-${task.one_off_task_id}`}
                        className="sr-only"
                      >{`Select task ${task.title}`}</label>
                      <input
                        id={`select-task-${task.one_off_task_id}`}
                        type="checkbox"
                        className="form-checkbox text-primary focus:ring-primary dark:focus:ring-primary h-4 w-4 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
                        checked={isSelected}
                        onChange={(e) =>
                          handleRowSelect(task.one_off_task_id, e)
                        }
                      />
                    </TableCell>
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
                            ID: {task.one_off_task_id}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-theme-sm max-w-xs truncate px-4 py-3 text-start text-gray-500 dark:text-gray-400">
                      {task.description || "No description provided"}
                    </TableCell>
                    <TableCell className="text-theme-sm px-4 py-3 text-start text-gray-500 dark:text-gray-400">
                      <Badge size="sm">{formatDate(task.deadline)}</Badge>
                    </TableCell>
                    <TableCell className="text-theme-sm px-4 py-3 text-start text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-gray-400" />{" "}
                        <span>{formatDuration(task.duration_minutes)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <LockClosedIcon className="h-4 w-4 text-gray-400" />
                        <Badge size="sm" color={constraintInfo.color}>
                          {constraintInfo.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-theme-sm px-4 py-3 text-gray-500 dark:text-gray-400">
                      {task.category_id ? (
                        <Badge size="sm" color="info">
                          Category #{task.category_id}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">
                          No category
                        </span>
                      )}
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
