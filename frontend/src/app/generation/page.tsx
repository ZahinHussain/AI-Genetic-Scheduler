"use client"; // <--- Keep this at the very top

import React, { useState } from "react"; 
import { useRouter } from "next/navigation"; // Import for navigation
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

// --- Import BOTH table components ---
import TaskList from "@/components/tables/reccuringTaskSelect"; // Assuming this is for RECURRING tasks
import OneOffTasksTable from "@/components/tables/oneOffTaskSelect"; // Assuming this is for ONE-OFF tasks

export default function Generation() { 
  const router = useRouter(); // Initialize router for navigation
  
  // --- State for Recurring Tasks Table ---
  const [selectedRecurringIds, setSelectedRecurringIds] = useState<number[]>([]);

  const handleRecurringSelectionChange = (newSelectedIds: number[]) => {
    setSelectedRecurringIds(newSelectedIds);
    console.log("Selected Recurring Task IDs:", newSelectedIds);
  };

  const handleProceedWithRecurring = () => {
    if (selectedRecurringIds.length === 0) {
      alert("Please select at least one recurring task to proceed.");
      return;
    }
    console.log("Proceeding with RECURRING tasks:", selectedRecurringIds);
    alert(`Proceeding with ${selectedRecurringIds.length} selected recurring tasks: ${selectedRecurringIds.join(', ')}`);
    // Optionally clear selection:
    // setSelectedRecurringIds([]);
  };

  // --- State for One-Off Tasks Table ---
  const [selectedOneOffIds, setSelectedOneOffIds] = useState<number[]>([]);

  const handleOneOffSelectionChange = (newSelectedIds: number[]) => {
    setSelectedOneOffIds(newSelectedIds);
    console.log("Selected One-Off Task IDs:", newSelectedIds);
  };

  const handleProceedWithOneOff = () => {
    if (selectedOneOffIds.length === 0) {
      alert("Please select at least one one-off task to proceed.");
      return;
    }
    console.log("Proceeding with ONE-OFF tasks:", selectedOneOffIds);
    alert(`Proceeding with ${selectedOneOffIds.length} selected one-off tasks: ${selectedOneOffIds.join(', ')}`);
    // Optionally clear selection:
    // setSelectedOneOffIds([]);
  };

  // New function to navigate to results page with selected tasks
  const handleViewResults = () => {
    // Check if any tasks are selected
    const hasSelectedTasks = selectedRecurringIds.length > 0 || selectedOneOffIds.length > 0;
    
    if (!hasSelectedTasks) {
      alert("Please select at least one task before viewing results.");
      return;
    }
    
    // Create query parameters with selected task IDs
    const params = new URLSearchParams();
    
    if (selectedRecurringIds.length > 0) {
      params.append('recurring', selectedRecurringIds.join(','));
    }
    
    if (selectedOneOffIds.length > 0) {
      params.append('oneoff', selectedOneOffIds.join(','));
    }
    
    // Navigate to results page with query parameters
    router.push(`/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 px-5 py-7 xl:px-10 xl:py-12 rounded-xs">
        
        {/* Breadcrumb */}
        <PageBreadcrumb pageTitle="Generation" /> 

        <div className="mt-5">
          {/* --- Container for Recurring Tasks Table --- */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
            <div className="flex justify-between items-center mb-6"> 
                <h4 className="text-xl font-semibold text-black dark:text-white">
                  Available Recurring Tasks
                </h4>
                <button
                    onClick={handleProceedWithRecurring}
                    disabled={selectedRecurringIds.length === 0}
                    className={`rounded bg-primary py-2 px-4 text-sm font-medium text-gray hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white`} 
                >
                    Proceed with Recurring ({selectedRecurringIds.length})
                </button>
            </div>
              
            <TaskList 
                selectedTaskIds={selectedRecurringIds} 
                onSelectionChange={handleRecurringSelectionChange} 
            />
          </div>

          {/* --- Container for One-Off Tasks Table --- */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
            <div className="flex justify-between items-center mb-6"> 
                <h4 className="text-xl font-semibold text-black dark:text-white">
                    Available One-Off Tasks 
                </h4>
                <button
                    onClick={handleProceedWithOneOff}
                    disabled={selectedOneOffIds.length === 0}
                    className={`rounded bg-secondary py-2 px-4 text-sm font-medium text-gray hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white`}
                >
                    Proceed with One-Off ({selectedOneOffIds.length})
                </button>
            </div>

            <OneOffTasksTable 
                selectedTaskIds={selectedOneOffIds}
                onSelectionChange={handleOneOffSelectionChange}
            />
          </div>
          
          {/* Results button container */}
          <div className="mt-8 flex justify-center">
  <button
    onClick={handleViewResults}
    disabled={selectedRecurringIds.length === 0 && selectedOneOffIds.length === 0}
    className="
      rounded-lg 
      bg-blue-600 
      hover:bg-blue-700 
      text-white 
      font-semibold 
      text-lg 
      py-4 
      px-10 
      shadow-lg 
      transition 
      disabled:opacity-50 
      disabled:cursor-not-allowed 
      flex items-center gap-2
    "
  >
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      strokeWidth={1.5} 
      stroke="currentColor" 
      className="w-6 h-6"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" 
      />
    </svg>
    Generate 
  </button>
</div>
        </div>
    </div>
  );
}