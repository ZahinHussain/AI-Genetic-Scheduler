import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table"; // Assuming path is correct

// Define the interface for a Task
interface Task {
  id: number;
  name: string;
  time: string; // e.g., "HH:MM"
  day: string;  // e.g., "MM/DD/YYYY"
  category: string;
}

// Create placeholder task data
const taskData: Task[] = [
  {
    id: 101,
    name: "Design landing page mockups",
    time: "10:00",
    day: "04/28/2024",
    category: "Design",
  },
  {
    id: 102,
    name: "Develop API endpoint for users",
    time: "14:30",
    day: "04/29/2024",
    category: "Development",
  },
  {
    id: 103,
    name: "Write blog post about new feature",
    time: "09:15",
    day: "04/28/2024",
    category: "Content",
  },
  {
    id: 104,
    name: "Client meeting preparation",
    time: "16:00",
    day: "05/01/2024",
    category: "Meeting",
  },
  {
    id: 105,
    name: "Update project documentation",
    time: "11:45",
    day: "05/02/2024",
    category: "Admin",
  },
];

export default function TaskListTable() {

  // Placeholder delete handler function
  const handleDelete = (taskId: number) => {
    console.log(`Attempting to delete task with ID: ${taskId}`);
    alert(`Delete button clicked for Task ID: ${taskId}`);
  };

  // --- Generate Table Rows using a for loop ---
  const tableRows = []; // Initialize an empty array to hold the row JSX elements
  for (const task of taskData) {
    // Create the JSX for each row inside the loop
    tableRows.push(
      <TableRow key={task.id}> {/* Key is still crucial here */}
        {/* ID Cell */}
        <TableCell className="px-4 py-3 text-gray-800 text-start text-theme-sm dark:text-white/90">
          {task.id}
        </TableCell>
        {/* Task Name Cell */}
        <TableCell className="px-4 py-3 text-gray-800 text-start text-theme-sm dark:text-white/90">
          {task.name}
        </TableCell>
        {/* Time Cell */}
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {task.time}
        </TableCell>
        {/* Day Cell */}
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {task.day}
        </TableCell>
        {/* Category Cell */}
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {task.category}
        </TableCell>
        {/* Actions Cell (Delete Button) */}
        <TableCell className="px-4 py-3 text-center text-theme-sm">
          <button
            onClick={() => handleDelete(task.id)}
            className="px-2 py-1 text-red-600 transition-colors duration-150 border border-red-500 rounded hover:bg-red-100 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/30 text-theme-xs"
            aria-label={`Delete task ${task.id}`}
          >
            Delete
          </button>
        </TableCell>
      </TableRow>
    );
  }
  // --- End of for loop ---


  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[800px]">
          <Table>
            {/* Table Header (remains the same) */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
               <TableRow>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[60px]"
                >
                  ID
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Task Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[100px]"
                >
                  Time
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[120px]"
                >
                  Day
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[150px]"
                >
                  Category
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 w-[100px]"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body - Render the generated rows */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {/* Render the array of JSX elements created by the loop */}
              {tableRows}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}