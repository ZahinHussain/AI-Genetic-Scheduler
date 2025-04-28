"use client";
import React, { useState, useMemo } from "react";
import Label from "../Label";
import Input from "../input/InputField";
import DatePicker from "@/components/form/date-picker";
import { ClockIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

// Helper function to combine date and time to create an ISO string for the API
const createISODateTime = (date: Date, time: string): string => {
  const [hours, minutes] = time.split(":").map(Number);
  const dateTime = new Date(date);
  dateTime.setHours(hours, minutes, 0); // Set hours, minutes, and 0 seconds
  return dateTime.toISOString();
};

// Helper function to format time for input (HH:MM)
const formatTimeForInput = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

// Parse an ISO date string to extract date and time
const parseISODateTime = (
  isoString: string | undefined,
): { date: Date; time: string } => {
  if (!isoString) {
    const now = new Date();
    return { date: now, time: formatTimeForInput(now) };
  }
  const date = new Date(isoString);
  return {
    date,
    time: formatTimeForInput(date),
  };
};

// Define the structure for the one-off task data - exact match to the API's expected format
interface OneOffTaskData {
  deadline: string | null; // ISO date string "2023-12-20T16:00:00Z" or null
  duration_minutes: number; // Duration in minutes (e.g., 120)
  category_id: number | null; // Optional category ID
  constraint: string; // Constraint type (e.g., "hard", "soft", "")
  title: string; // Task title
  description: string; // Task description
}

interface OneOffTaskFormProps {
  initialTaskData?: Partial<OneOffTaskData>;
  onSubmit?: (taskData: OneOffTaskData) => void; // Optional callback
  submitButtonText?: string;
}

export default function AddOneOffTask({
  initialTaskData = {},
  onSubmit,
  submitButtonText = "Add One-Off Task",
}: OneOffTaskFormProps) {
  // Sample initial data for defaults
  const sampleData: OneOffTaskData = {
    deadline: null,
    duration_minutes: 120,
    category_id: null,
    constraint: "hard",
    title: "Research AI Scheduling Algorithms",
    description:
      "Review literature on genetic algorithms for scheduling optimization",
  };

  // Calculate default values
  const defaultDateTime = useMemo(() => {
    const now = new Date();

    // Only parse deadline if it exists in initialTaskData
    if (initialTaskData.deadline) {
      const { date, time } = parseISODateTime(initialTaskData.deadline);
      return {
        date,
        time,
        duration:
          initialTaskData.duration_minutes || sampleData.duration_minutes,
      };
    }

    // Otherwise use current date/time
    return {
      date: now,
      time: formatTimeForInput(now),
      duration: initialTaskData.duration_minutes || sampleData.duration_minutes,
    };
  }, [initialTaskData.deadline]);

  // --- State for form fields ---
  const [title, setTitle] = useState(initialTaskData.title || sampleData.title);
  const [description, setDescription] = useState(
    initialTaskData.description || sampleData.description,
  );
  const [categoryId, setCategoryId] = useState<number | null>(
    initialTaskData.category_id !== undefined
      ? initialTaskData.category_id
      : sampleData.category_id,
  );
  const [duration, setDuration] = useState<number>(
    initialTaskData.duration_minutes || sampleData.duration_minutes,
  );
  const [constraint, setConstraint] = useState<string>(
    initialTaskData.constraint !== undefined
      ? initialTaskData.constraint
      : sampleData.constraint,
  );

  // Date and time for the deadline - null by default unless provided in initialTaskData
  const [hasDeadline, setHasDeadline] = useState<boolean>(
    !!initialTaskData.deadline,
  );
  const [deadlineDate, setDeadlineDate] = useState<Date>(
    initialTaskData.deadline
      ? parseISODateTime(initialTaskData.deadline).date
      : new Date(),
  );
  const [deadlineTime, setDeadlineTime] = useState<string>(
    initialTaskData.deadline
      ? parseISODateTime(initialTaskData.deadline).time
      : formatTimeForInput(new Date()),
  );

  // --- Handle form submission ---
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validate required fields
    if (!title) {
      toast.error("Please enter a task title");
      return;
    }

    if (!duration || duration <= 0) {
      toast.error("Please enter a valid duration");
      return;
    }

    // Create the task data object - exactly matching the expected API format
    const taskData: OneOffTaskData = {
      deadline: hasDeadline
        ? createISODateTime(deadlineDate, deadlineTime)
        : null,
      duration_minutes: duration,
      category_id: categoryId,
      constraint: constraint,
      title: title,
      description: description || "",
    };

    console.log("Submitting one-off task:", JSON.stringify(taskData, null, 2));

    try {
      // Submit to API
      const response = await fetch("/api/oneofftasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error("Failed to add one-off task");
      }

      // Show success message
      toast.success("One-off task added successfully");

      // Call the onSubmit callback if provided
      if (onSubmit) {
        onSubmit(taskData);
      }

      // Clear form or reset to defaults
      setTitle("");
      setDescription("");
      setCategoryId(null);
      setDuration(defaultDateTime.duration);
      setHasDeadline(false);
      setConstraint("hard"); // Default to hard constraint
    } catch (error) {
      console.error("Error adding one-off task:", error);
      toast.error("Failed to add one-off task");
    }
  };

  // --- Handle DatePicker changes ---
  const handleDateChange = (
    selectedDates: Date[],
    dateStr: string,
    instance: any,
  ) => {
    if (selectedDates.length > 0) {
      setDeadlineDate(selectedDates[0]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 md:p-6">
      <div className="mb-8 grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
        {/* Task Title */}
        <div>
          <Label htmlFor="task-title">Task Title</Label>
          <Input
            id="task-title"
            type="text"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full"
            required
            placeholder="Research AI Scheduling Algorithms"
          />
        </div>

        {/* Category ID (optional) */}
        <div>
          <Label htmlFor="category-id">Category ID (Optional)</Label>
          <Input
            id="category-id"
            type="number"
            name="categoryId"
            value={categoryId !== null ? categoryId : ""}
            onChange={(e) =>
              setCategoryId(e.target.value ? parseInt(e.target.value) : null)
            }
            className="w-full"
            placeholder="Category ID (if applicable)"
          />
        </div>

        {/* Optional Deadline Toggle */}
        <div className="md:col-span-2">
          <div className="mb-2 flex items-center">
            <input
              id="has-deadline"
              type="checkbox"
              checked={hasDeadline}
              onChange={(e) => setHasDeadline(e.target.checked)}
              className="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <Label htmlFor="has-deadline">Set a deadline for this task</Label>
          </div>
        </div>

        {/* Deadline Date and Time (only shown if hasDeadline is true) */}
        {hasDeadline && (
          <>
            <div>
              <Label htmlFor="deadline-date">Deadline Date</Label>
              <DatePicker
                id="deadline-date"
                value={deadlineDate}
                options={{
                  dateFormat: "Y-m-d",
                  defaultDate: deadlineDate,
                  minDate: "today",
                }}
                placeholder="YYYY-MM-DD"
                onChange={handleDateChange}
                className="dark:bg-dark-900 w-full"
              />
            </div>

            <div>
              <Label htmlFor="deadline-time">Deadline Time</Label>
              <div className="relative">
                <Input
                  id="deadline-time"
                  type="time"
                  name="deadlineTime"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  className="w-full pr-10"
                  required={hasDeadline}
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <ClockIcon className="h-5 w-5" />
                </span>
              </div>
            </div>
          </>
        )}

        {/* Duration in Minutes */}
        <div>
          <Label htmlFor="duration">Duration (minutes)</Label>
          <div className="relative">
            <Input
              id="duration"
              type="number"
              name="duration"
              value={duration}
              min={30}
              step={15}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              className="w-full pr-16"
              required
              placeholder="120"
            />
            <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
              minutes
            </span>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {duration >= 60
              ? `${Math.floor(duration / 60)} hour${Math.floor(duration / 60) !== 1 ? "s" : ""} ${duration % 60 ? `${duration % 60} min` : ""}`
              : `${duration} minutes`}
          </div>
        </div>

        {/* Constraint Type */}
        <div>
          <Label htmlFor="constraint-type">Constraint Type</Label>
          <select
            id="constraint-type"
            value={constraint}
            onChange={(e) => setConstraint(e.target.value)}
            className="dark:bg-dark-900 w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none dark:border-gray-700"
          >
            <option value="">No Constraint</option>
            <option value="hard">Hard Constraint</option>
            <option value="soft">Soft Constraint</option>
          </select>
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <Label htmlFor="task-description">Description</Label>
          <div className="relative">
            <textarea
              id="task-description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="dark:bg-dark-900 h-24 w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none dark:border-gray-700"
              placeholder="Review literature on genetic algorithms for scheduling optimization"
            />
            <span className="absolute top-3 right-3 text-gray-500 dark:text-gray-400">
              <DocumentTextIcon className="h-5 w-5" />
            </span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          type="submit"
          className="rounded border border-gray-400 bg-gray-200 px-4 py-2 text-black hover:bg-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
        >
          {submitButtonText}
        </button>
      </div>
    </form>
  );
}
