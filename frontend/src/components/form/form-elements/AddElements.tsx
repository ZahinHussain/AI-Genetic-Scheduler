"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Label from '../Label'; // Assuming Label component exists
import Input from '../input/InputField'; // Assuming Input component exists
import DatePicker from '@/components/form/date-picker'; // Assuming DatePicker component exists
import { TimeIcon } from '../../../icons'; // Assuming TimeIcon path is correct

// Helper function to format time as HH:MM (required by input type="time")
const formatTime = (date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Define the structure for the task data prop
interface TaskData {
  time?: string; // HH:MM format
  day?: string | Date; // Can accept string (e.g., "MM/DD/YYYY") or Date object
  taskName?: string;
  taskCategory?: string;
}

interface TaskInputFormProps {
  initialTaskData?: TaskData;
  onSubmit: (taskData: Required<TaskData>) => void; // Function to call on submit
  submitButtonText?: string; // Optional text for the submit button
}

export default function TaskInputForm({
  initialTaskData = {}, // Default to empty object if no initial data provided
  onSubmit,
  submitButtonText = "Add Buffer" // Default button text
}: TaskInputFormProps) {

  // Calculate default date (today) and time (+3 hours) only once
  const defaultDateTime = useMemo(() => {
    const now = new Date();
    const defaultDate = new Date(now); // Clone for date
    const defaultTimeDate = new Date(now); // Clone for time calculation
    defaultTimeDate.setHours(now.getHours() + 3); // Add 3 hours
    return {
      date: defaultDate, // Today as a Date object
      time: formatTime(defaultTimeDate), // Time + 3 hours as HH:MM string
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- State for form fields ---
  // Initialize with prop data if available, otherwise use calculated defaults or empty strings
  const [taskName, setTaskName] = useState(initialTaskData.taskName || '');
  const [taskCategory, setTaskCategory] = useState(initialTaskData.taskCategory || '');
  const [time, setTime] = useState(initialTaskData.time || defaultDateTime.time);

  // DatePicker state needs careful handling based on what DatePicker component expects/returns
  // We initialize with initialTaskData.day or the default Date object.
  // The `DatePicker`'s `onChange` might return a string or a Date object array.
  // We store the Date object internally for consistency if possible.
  const [day, setDay] = useState<Date | string | undefined>(
    initialTaskData.day || defaultDateTime.date
  );

  // --- Handle form submission ---
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default form submission if wrapped in <form>

    // Ensure day is in a consistent format (e.g., MM/DD/YYYY string) before submitting
    let formattedDay = '';
    if (day instanceof Date) {
        // Format Date object to MM/DD/YYYY
        const month = String(day.getMonth() + 1).padStart(2, '0');
        const dateNum = String(day.getDate()).padStart(2, '0');
        const year = day.getFullYear();
        formattedDay = `${month}/${dateNum}/${year}`;
    } else if (typeof day === 'string') {
        // Assume string is already in the correct format or handle potential parsing/reformatting
        formattedDay = day; // Or reformat if needed: e.g., reformatDateString(day)
    }

    onSubmit({
      time, // HH:MM string
      day: formattedDay, // MM/DD/YYYY string (or desired consistent format)
      taskName,
      taskCategory,
    });
  };

  // --- Handle DatePicker changes ---
  // Adjust based on how your DatePicker's onChange works
  const handleDateChange = (selectedDates: Date[], dateStr: string, instance: any) => {
    // Often, selectedDates[0] is the Date object we want
    // dateStr is the formatted string based on dateFormat
    setDay(selectedDates[0] || dateStr); // Prefer Date object if available
    console.log("Date selected:", selectedDates[0] || dateStr);
  };

  return (
    // Consider wrapping in a <form> tag if appropriate
    // <form onSubmit={handleSubmit} className="p-4 md:p-6">
    <div className="p-4 md:p-6"> {/* Added padding for spacing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8"> {/* Grid layout */}

        {/* Input Time */}
        <div>
          <Label htmlFor="input-time">Input Time</Label>
          <div className="relative">
            <Input
              id="input-time"
              type="time"
              name="time"
              value={time} // Controlled component
              onChange={(e) => setTime(e.target.value)} // Update state on change
              className="pr-10"
            />
            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
              <TimeIcon />
            </span>
          </div>
        </div>


        {/* Input Day - Using DatePicker */}
        <div>
          <Label htmlFor="input-day">Input Day</Label>
          <DatePicker
            id="input-day"
            // Keep 'value' prop for controlled updates after initial render/selection
            value={day}
            options={{
              dateFormat: "m/d/Y", // Format for display and the dateStr in onChange
              // *** Add defaultDate here ***
              // Use the initial prop value if provided, otherwise use today's date object.
              // This tells the underlying library what to display initially.
              defaultDate: initialTaskData.day || defaultDateTime.date,
            }}
            placeholder="mm/dd/yyyy"
            onChange={handleDateChange} // Updates the 'day' state, making it controlled
            className="dark:bg-dark-900" // Example style
          />
        </div>

        {/* Input Task Name */}
        <div>
          <Label htmlFor="input-task-name">Input    {submitButtonText}Name</Label>
          <Input
            id="input-task-name"
            type="text"
            name="taskName"
            value={taskName} // Controlled component
            onChange={(e) => setTaskName(e.target.value)} // Update state on change
          />
        </div>

        {/* Input Task Category */}
        <div>
          <Label htmlFor="input-task-category">Input    {submitButtonText} Category</Label>
          <Input
            id="input-task-category"
            type="text"
            name="taskCategory"
            value={taskCategory} // Controlled component
            onChange={(e) => setTaskCategory(e.target.value)} // Update state on change
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          type="button" // Change to type="submit" if wrapped in a <form>
          onClick={handleSubmit} // Call submit handler
          className="px-4 py-2 bg-gray-200 text-black rounded border border-gray-400 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
        >
          Add {submitButtonText} {/* Use the prop for button text */}
        </button>
      </div>
    </div>
    // </form>
  );
}