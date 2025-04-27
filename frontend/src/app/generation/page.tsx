"use client"; // Keep this at the very top

import React, { useState } from "react"; 
import { useRouter } from "next/navigation"; // Import for navigation
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

// --- Import BOTH table components ---
import TaskList from "@/components/tables/reccuringTaskSelect"; // Assuming this is for RECURRING tasks
import OneOffTasksTable from "@/components/tables/oneOffTaskSelect"; // Assuming this is for ONE-OFF tasks





async function PostGaData(gaData = {}) {
  console.log('Sending GA data:', gaData);

  try {
    // Use the URL WITHOUT trailing slash to match our updated backend
    const response = await fetch('/api/ga', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gaData),
    });

    if (!response.ok) {
      let errorDetails;
      try {
        errorDetails = await response.json();
      } catch {
        errorDetails = null;
      }
      console.error('Error response:', response.status, response.statusText, errorDetails);
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Server response:', data);
    return data;

  } catch (error) {
    console.error('Failed to send GA data:', error);
    throw error;
  }
}
export default function Generation() { 
  const router = useRouter(); // Initialize router for navigation
  
  // --- State for Recurring Tasks Table ---
  const [selectedRecurringIds, setSelectedRecurringIds] = useState<number[]>([]);

  const handleRecurringSelectionChange = (newSelectedIds: number[]) => {
    setSelectedRecurringIds(newSelectedIds);
    console.log("Selected Recurring Task IDs:", newSelectedIds);
  };


  

  // --- State for One-Off Tasks Table ---
  const [selectedOneOffIds, setSelectedOneOffIds] = useState<number[]>([]);

  const handleOneOffSelectionChange = (newSelectedIds: number[]) => {
    setSelectedOneOffIds(newSelectedIds);
    console.log("Selected One-Off Task IDs:", newSelectedIds);
  };

  const [selectedDate, setSelectedDate] = useState(''); // State for the date input

  const handleDateChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
    console.log("Selected date:", event.target.value);
    setSelectedDate(event.target.value); // Updates the state with the new value from the input
  };

  const handleProceedWithRecurring = () => {
    if (selectedRecurringIds.length === 0) {
      alert("Please select at least one recurring task to proceed.");
      return;
    }
    console.log("Proceeding with RECURRING tasks:", selectedRecurringIds);
    alert(`Proceeding with ${selectedRecurringIds.length} selected recurring tasks: ${selectedRecurringIds.join(', ')}`);
  };

  const handleProceedWithOneOff = () => {
    if (selectedOneOffIds.length === 0) {
      alert("Please select at least one one-off task to proceed.");
      return;
    }
    console.log("Proceeding with ONE-OFF tasks:", selectedOneOffIds);
    alert(`Proceeding with ${selectedOneOffIds.length} selected one-off tasks: ${selectedOneOffIds.join(', ')}`);
  };

  // New function to navigate to results page with selected tasks
  const handleViewResults = async () => {
    const hasSelectedTasks = selectedRecurringIds.length > 0 || selectedOneOffIds.length > 0;
  
    if (!hasSelectedTasks) {
      alert("Please select at least one task before viewing results.");
      return;
    }
  
    if (!selectedDate) {
      alert("Please select a start date before viewing results.");
      return;
    }
  
    const selectedTasks = {
      recurring_task_ids: selectedRecurringIds.length > 0 ? selectedRecurringIds : [],
      one_off_task_ids: selectedOneOffIds.length > 0 ? selectedOneOffIds : [],
      day_start: selectedDate // pass the date here too!
    };
  
    try {
      await PostGaData(selectedTasks);
      alert("Selected tasks and date successfully sent!");
    } catch (error) {
      alert("Failed to send data. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-5 py-7 xl:px-10 xl:py-12 rounded-lg">
      <PageBreadcrumb pageTitle="Generation" />

      <div className="mt-5 space-y-6">

        {/* --- Recurring Tasks --- */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              Available Recurring Tasks
            </h4>
            <button
              onClick={handleProceedWithRecurring}
              disabled={selectedRecurringIds.length === 0}
              className="rounded bg-primary py-2 px-4 text-sm font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white"
            >
              Proceed with Recurring ({selectedRecurringIds.length})
            </button>
          </div>
          <TaskList
            selectedTaskIds={selectedRecurringIds}
            onSelectionChange={handleRecurringSelectionChange}
          />
        </div>

        {/* --- One-Off Tasks --- */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              Available One-Off Tasks
            </h4>
            <button
              onClick={handleProceedWithOneOff}
              disabled={selectedOneOffIds.length === 0}
              className="rounded bg-secondary py-2 px-4 text-sm font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white"
            >
              Proceed with One-Off ({selectedOneOffIds.length})
            </button>
          </div>
          <OneOffTasksTable
            selectedTaskIds={selectedOneOffIds}
            onSelectionChange={handleOneOffSelectionChange}
          />
        </div>

        {/* --- Date and Generate Button --- */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-start gap-2">
              <h4 className="text-xl font-semibold text-black dark:text-white">
                Select Start Date
              </h4>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange} 
                className="border border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            <button
              onClick={handleViewResults}
              disabled={(selectedRecurringIds.length === 0 && selectedOneOffIds.length === 0) || !selectedDate}
              className="w-full sm:w-auto rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg py-4 px-10 shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Generate
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
