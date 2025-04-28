"use client";
import React, { useState } from "react";

interface TaskInputProps {
  onAddTask: (task: {
    inputTime: string;
    time: string;
    taskName: string;
    category: string;
  }) => void;
}

const TaskInputCard: React.FC<TaskInputProps> = ({ onAddTask }) => {
  const [inputTime, setInputTime] = useState("");
  const [time, setTime] = useState("");
  const [taskName, setTaskName] = useState("");
  const [category, setCategory] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputTime && time && taskName && category) {
      onAddTask({
        inputTime,
        time,
        taskName,
        category,
      });
      // Reset form
      setInputTime("");
      setTime("");
      setTaskName("");
      setCategory("");
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
        Add New Task
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Input Time Button/Field */}
          <div>
            <label
              htmlFor="inputTime"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Input Time
            </label>
            <div className="relative">
              <input
                type="time"
                id="inputTime"
                value={inputTime}
                onChange={(e) => setInputTime(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700"
                required
              />
              <button
                type="button"
                onClick={() =>
                  setInputTime(
                    new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  )
                }
                className="absolute top-1/2 right-2 -translate-y-1/2 transform rounded bg-blue-100 px-2 py-1 text-xs text-blue-600 dark:bg-blue-800 dark:text-blue-200"
              >
                Now
              </button>
            </div>
          </div>

          {/* Time Duration Button/Field */}
          <div>
            <label
              htmlFor="time"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Time (minutes)
            </label>
            <div className="relative">
              <input
                type="number"
                id="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="30"
                min="1"
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700"
                required
              />
              <div className="absolute top-1/2 right-2 flex -translate-y-1/2 transform space-x-1">
                <button
                  type="button"
                  onClick={() => setTime("15")}
                  className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-600 dark:bg-blue-800 dark:text-blue-200"
                >
                  15
                </button>
                <button
                  type="button"
                  onClick={() => setTime("30")}
                  className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-600 dark:bg-blue-800 dark:text-blue-200"
                >
                  30
                </button>
                <button
                  type="button"
                  onClick={() => setTime("60")}
                  className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-600 dark:bg-blue-800 dark:text-blue-200"
                >
                  60
                </button>
              </div>
            </div>
          </div>

          {/* Task Name Button/Field */}
          <div>
            <label
              htmlFor="taskName"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Task Name
            </label>
            <input
              type="text"
              id="taskName"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Enter task name"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700"
              required
            />
          </div>

          {/* Category Button/Field */}
          <div>
            <label
              htmlFor="category"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Category
            </label>
            <div className="relative">
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700"
                required
              >
                <option value="" disabled>
                  Select category
                </option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Study">Study</option>
                <option value="Health">Health</option>
                <option value="Other">Other</option>
              </select>
              <div className="absolute top-1/2 right-2 flex -translate-y-1/2 transform space-x-1">
                <button
                  type="button"
                  onClick={() => setCategory("Work")}
                  className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-600 dark:bg-blue-800 dark:text-blue-200"
                >
                  Work
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add Task Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            Add Task
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskInputCard;
