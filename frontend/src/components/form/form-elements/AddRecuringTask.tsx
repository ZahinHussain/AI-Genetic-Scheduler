"use client";
import React, { useState } from "react";
import Label from "../Label";
import Input from "../input/InputField";
import { ClockIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

// Define days of week options
const daysOfWeek = [
  { value: "Mon", label: "Monday" },
  { value: "Tue", label: "Tuesday" },
  { value: "Wed", label: "Wednesday" },
  { value: "Thu", label: "Thursday" },
  { value: "Fri", label: "Friday" },
  { value: "Sat", label: "Saturday" },
  { value: "Sun", label: "Sunday" },
];

// Define the structure for the recurring task data - matches the API's expected format
interface RecurringTaskData {
  start_date: string; // Day of week abbreviation (e.g., "Mon")
  end_date: string | null; // Day of week abbreviation or null
  event_start_time: string; // Time format: HH:MM:SS
  event_end_time: string; // Time format: HH:MM:SS
  category_id: number | null; // Optional category ID
  constraint: string; // Constraint type (e.g., "hard", "soft")
  title: string; // Task title
  description: string; // Task description
}

interface RecurringTaskFormProps {
  initialTaskData?: Partial<RecurringTaskData>;
  onSubmit?: (taskData: RecurringTaskData) => void; // Optional callback
  submitButtonText?: string;
}

export default function AddRecurringTask({
  initialTaskData = {},
  onSubmit,
  submitButtonText = "Add Recurring Task",
}: RecurringTaskFormProps) {
  // Sample initial data for defaults
  const sampleData: RecurringTaskData = {
    start_date: "Mon",
    end_date: "Mon",
    event_start_time: "09:00:00",
    event_end_time: "10:30:00",
    category_id: null,
    constraint: "hard",
    title: "Weekly Team Meeting",
    description: "Regular synchronization meeting with the development team",
  };

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
  const [constraint, setConstraint] = useState<string>(
    initialTaskData.constraint !== undefined
      ? initialTaskData.constraint
      : sampleData.constraint,
  );

  // Day of week selections
  const [startDate, setStartDate] = useState<string>(
    initialTaskData.start_date || sampleData.start_date,
  );
  const [endDate, setEndDate] = useState<string | null>(
    initialTaskData.end_date !== undefined
      ? initialTaskData.end_date
      : sampleData.end_date,
  );

  // Time for the event
  const [startTime, setStartTime] = useState<string>(
    initialTaskData.event_start_time || sampleData.event_start_time,
  );
  const [endTime, setEndTime] = useState<string>(
    initialTaskData.event_end_time || sampleData.event_end_time,
  );

  // Function to ensure time is in HH:MM:SS format
  const formatTimeWithSeconds = (time: string): string => {
    // If time is already in HH:MM:SS format, return it
    if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
      return time;
    }

    // If time is in HH:MM format, add :00 for seconds
    if (/^\d{2}:\d{2}$/.test(time)) {
      return `${time}:00`;
    }

    // Otherwise, return default
    return "00:00:00";
  };

  // --- Handle form submission ---
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validate required fields
    if (!title) {
      toast.error("Please enter a task title");
      return;
    }

    if (!startDate) {
      toast.error("Please select a start day");
      return;
    }

    if (!startTime || !endTime) {
      toast.error("Please enter both start and end times");
      return;
    }

    // Format times to ensure they have seconds
    const formattedStartTime = formatTimeWithSeconds(startTime);
    const formattedEndTime = formatTimeWithSeconds(endTime);

    // Create the task data object - exactly matching the expected API format
    const taskData: RecurringTaskData = {
      start_date: startDate,
      end_date: endDate,
      event_start_time: formattedStartTime,
      event_end_time: formattedEndTime,
      category_id: categoryId,
      constraint: constraint,
      title: title,
      description: description || "",
    };

    console.log(
      "Submitting recurring task:",
      JSON.stringify(taskData, null, 2),
    );

    try {
      // Submit to API
      const response = await fetch("/api/recurringtasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error("Failed to add recurring task");
      }

      // Show success message
      toast.success("Recurring task added successfully");

      // Call the onSubmit callback if provided
      if (onSubmit) {
        onSubmit(taskData);
      }

      // Clear form or reset to defaults
      setTitle("");
      setDescription("");
      setCategoryId(null);
      setConstraint("hard");
    } catch (error) {
      console.error("Error adding recurring task:", error);
      toast.error("Failed to add recurring task");
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
            placeholder="Weekly Team Meeting"
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

        {/* Start Day */}
        <div>
          <Label htmlFor="start-day">Start Day</Label>
          <select
            id="start-day"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="dark:bg-dark-900 w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none dark:border-gray-700"
            required
          >
            <option value="">Select a day</option>
            {daysOfWeek.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>

        {/* End Day */}
        <div>
          <Label htmlFor="end-day">End Day (Optional)</Label>
          <select
            id="end-day"
            value={endDate || ""}
            onChange={(e) => setEndDate(e.target.value || null)}
            className="dark:bg-dark-900 w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none dark:border-gray-700"
          >
            <option value="">Select a day (optional)</option>
            {daysOfWeek.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>

        {/* Start Time */}
        <div>
          <Label htmlFor="start-time">Start Time</Label>
          <div className="relative">
            <Input
              id="start-time"
              type="time"
              name="startTime"
              value={startTime.substring(0, 5)} // Show only HH:MM part
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full pr-10"
              required
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 dark:text-gray-400">
              <ClockIcon className="h-5 w-5" />
            </span>
          </div>
        </div>

        {/* End Time */}
        <div>
          <Label htmlFor="end-time">End Time</Label>
          <div className="relative">
            <Input
              id="end-time"
              type="time"
              name="endTime"
              value={endTime.substring(0, 5)} // Show only HH:MM part
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full pr-10"
              required
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 dark:text-gray-400">
              <ClockIcon className="h-5 w-5" />
            </span>
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
              placeholder="Regular synchronization meeting with the development team"
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
