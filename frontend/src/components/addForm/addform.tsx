"use client"
import React, { useState } from 'react';

interface TaskInputProps {
  onAddTask: (task: {
    inputTime: string;
    time: string;
    taskName: string;
    category: string;
  }) => void;
}

const TaskInputCard: React.FC<TaskInputProps> = ({ onAddTask }) => {
  const [inputTime, setInputTime] = useState('');
  const [time, setTime] = useState('');
  const [taskName, setTaskName] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputTime && time && taskName && category) {
      onAddTask({
        inputTime,
        time,
        taskName,
        category
      });
      // Reset form
      setInputTime('');
      setTime('');
      setTaskName('');
      setCategory('');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Add New Task</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Input Time Button/Field */}
          <div>
            <label htmlFor="inputTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Input Time
            </label>
            <div className="relative">
              <input
                type="time"
                id="inputTime"
                value={inputTime}
                onChange={(e) => setInputTime(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setInputTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200 rounded text-xs"
              >
                Now
              </button>
            </div>
          </div>
          
          {/* Time Duration Button/Field */}
          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                <button
                  type="button"
                  onClick={() => setTime('15')}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200 rounded text-xs"
                >
                  15
                </button>
                <button
                  type="button"
                  onClick={() => setTime('30')}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200 rounded text-xs"
                >
                  30
                </button>
                <button
                  type="button"
                  onClick={() => setTime('60')}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200 rounded text-xs"
                >
                  60
                </button>
              </div>
            </div>
          </div>
          
          {/* Task Name Button/Field */}
          <div>
            <label htmlFor="taskName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task Name
            </label>
            <input
              type="text"
              id="taskName"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Enter task name"
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          
          {/* Category Button/Field */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <div className="relative">
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="" disabled>Select category</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Study">Study</option>
                <option value="Health">Health</option>
                <option value="Other">Other</option>
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                <button
                  type="button"
                  onClick={() => setCategory('Work')}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200 rounded text-xs"
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
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Task
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskInputCard;