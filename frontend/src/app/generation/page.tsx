"use client"; // Keep this at the very top

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation"; // Import for navigation
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

// --- Import BOTH table components ---
import TaskList from "@/components/tables/reccuringTaskSelect"; // Assuming this is for RECURRING tasks
import OneOffTasksTable from "@/components/tables/oneOffTaskSelect"; // Assuming this is for ONE-OFF tasks
import Calendar from "@/components/calendar/Calendar";

export default function Generation() {
  const [calendarData, setCalendarData] = useState<
    {
      description: string;
      title: string;
      scheduled_start: string;
      scheduled_end: string;
    }[]
  >([]);
  const [generationId, setGenerationId] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptSuccess, setAcceptSuccess] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Scroll to calendar when generation is complete
  useEffect(() => {
    if (isGenerated && calendarData.length > 0 && calendarRef.current) {
      calendarRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [isGenerated, calendarData]);

  async function PostGaData(gaData = {}) {
    setIsGenerating(true);
    setIsGenerated(false);
    setAcceptSuccess(false);
    console.log("Sending GA data:", gaData);

    try {
      // Use the URL WITHOUT trailing slash to match our updated backend
      const response = await fetch("/api/ga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gaData),
      });

      // First check if the response is OK (this doesn't consume the body)
      if (!response.ok) {
        console.error(
          "Error response status:",
          response.status,
          response.statusText,
        );
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // For debugging only - log the content type (this doesn't consume the body)
      console.log(
        "Response content type:",
        response.headers.get("content-type"),
      );

      // Parse the response as JSON
      try {
        const data = await response.json();
        console.log("Server response:", data);

        // If schedule or generation_id is undefined, log it but don't fail
        if (!data.schedule) {
          console.warn("Warning: schedule not found in response data");
        }
        if (!data.generation_id) {
          console.warn("Warning: generation_id not found in response data");
        }

        // Handle the case where the API might directly return the schedule array
        const scheduleArray = Array.isArray(data)
          ? data
          : data.schedule && Array.isArray(data.schedule)
            ? data.schedule
            : [];

        if (scheduleArray.length > 0) {
          // Format the data to match CalendarProps interface
          // Map from the API response format (with startDate/endDate) to what Calendar expects (scheduled_start/scheduled_end)
          const formattedSchedule = scheduleArray.map((item) => ({
            title: item.title || "Untitled Task",
            description: item.description || "",
            scheduled_start: item.startDate || "", // Map from startDate to scheduled_start
            scheduled_end: item.endDate || "", // Map from endDate to scheduled_end
          }));

          // Log the formatted data to confirm it's in the right structure
          console.log("Formatted calendar data:", formattedSchedule);

          setCalendarData(formattedSchedule);
        } else {
          console.error("Invalid or empty schedule data:", scheduleArray);
          setCalendarData([]);
        }

        // Set the generation ID if it exists
        if (data && data.generation_id) {
          setGenerationId(data.generation_id);
        } else if (data && data.id) {
          setGenerationId(data.id);
        } else {
          setGenerationId(null);
        }

        setIsGenerated(true);

        return data;
      } catch (parseError) {
        console.error("JSON parsing error:", parseError);
        throw new Error("Failed to parse server response as JSON");
      }
    } catch (error) {
      // Log the error but with more context
      console.error("Failed to send GA data:", error);

      // Re-throw the error for further handling
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }

  async function acceptSchedule() {
    // Don't proceed if there's no generation ID or if we're already accepting
    if (!generationId || isAccepting) {
      console.error(
        "Cannot accept schedule: No generation ID available or already in progress",
      );
      return;
    }

    setIsAccepting(true);
    setAcceptSuccess(false);

    try {
      // Prepare the data object with the structure the API expects
      const calendarData = {
        gaid: generationId,
        startDate: selectedDate,
      };

      console.log("Sending calendar accept data:", calendarData);

      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token")
            ? `Bearer ${localStorage.getItem("token")}`
            : "",
        },
        body: JSON.stringify(calendarData),
      });

      // Check if the response is successful
      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Error response from calendar API:",
          response.status,
          errorText,
        );
        throw new Error(
          `Failed to save to calendar: ${response.status} ${errorText}`,
        );
      }

      // Try to parse the response as JSON
      const result = await response.json();
      console.log("Calendar API response:", result);

      // Set success state and show a message to the user
      setAcceptSuccess(true);
      alert("Schedule successfully saved to your calendar!");

      // Optionally redirect to a calendar view page
      // router.push('/calendar');
    } catch (error) {
      console.error("Failed to accept schedule:", error);
      alert(
        `Failed to save schedule: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsAccepting(false);
    }
  }

  // --- State for Recurring Tasks Table ---
  const [selectedRecurringIds, setSelectedRecurringIds] = useState<number[]>(
    [],
  );

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

  const [selectedDate, setSelectedDate] = useState(""); // State for the date input

  const handleDateChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    console.log("Selected date:", event.target.value);
    setSelectedDate(event.target.value); // Updates the state with the new value from the input
  };

  const handleProceedWithRecurring = () => {
    if (selectedRecurringIds.length === 0) {
      alert("Please select at least one recurring task to proceed.");
      return;
    }
    console.log("Proceeding with RECURRING tasks:", selectedRecurringIds);
    alert(
      `Proceeding with ${selectedRecurringIds.length} selected recurring tasks: ${selectedRecurringIds.join(", ")}`,
    );
  };

  const handleProceedWithOneOff = () => {
    if (selectedOneOffIds.length === 0) {
      alert("Please select at least one one-off task to proceed.");
      return;
    }
    console.log("Proceeding with ONE-OFF tasks:", selectedOneOffIds);
    alert(
      `Proceeding with ${selectedOneOffIds.length} selected one-off tasks: ${selectedOneOffIds.join(", ")}`,
    );
  };

  // New function to navigate to results page with selected tasks
  const handleViewResults = async () => {
    const hasSelectedTasks =
      selectedRecurringIds.length > 0 || selectedOneOffIds.length > 0;

    if (!hasSelectedTasks) {
      alert("Please select at least one task before viewing results.");
      return;
    }

    if (!selectedDate) {
      alert("Please select a start date before viewing results.");
      return;
    }

    const selectedTasks = {
      recurring_task_ids:
        selectedRecurringIds.length > 0 ? selectedRecurringIds : [],
      one_off_task_ids: selectedOneOffIds.length > 0 ? selectedOneOffIds : [],
      day_start: selectedDate, // pass the date here too!
    };

    try {
      await PostGaData(selectedTasks);
      if (calendarData.length > 0) {
        // Success! The calendar will show automatically via the useEffect
        console.log("Calendar data loaded successfully!");
      } else {
        alert(
          "Generation complete but no schedule data was returned. Please try again.",
        );
      }
    } catch (error) {
      alert("Failed to send data. Please try again.");
    }
  };

  return (
    <div className="min-h-screen rounded-lg border border-gray-200 bg-white px-5 py-7 xl:px-10 xl:py-12 dark:border-gray-800 dark:bg-gray-900">
      <PageBreadcrumb pageTitle="Generation" />

      <div className="mt-5 space-y-6">
        {/* --- Recurring Tasks --- */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              Available Recurring Tasks
            </h4>
            <button
              onClick={handleProceedWithRecurring}
              disabled={selectedRecurringIds.length === 0}
              className="bg-primary hover:bg-opacity-90 rounded px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:text-white"
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
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              Available One-Off Tasks
            </h4>
            <button
              onClick={handleProceedWithOneOff}
              disabled={selectedOneOffIds.length === 0}
              className="bg-secondary hover:bg-opacity-90 rounded px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:text-white"
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
        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex flex-col items-start gap-2">
              <h4 className="text-xl font-semibold text-black dark:text-white">
                Select Start Date
              </h4>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            <button
              onClick={handleViewResults}
              disabled={
                (selectedRecurringIds.length === 0 &&
                  selectedOneOffIds.length === 0) ||
                !selectedDate ||
                isGenerating
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-10 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <svg
                    className="h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                  Generate
                </>
              )}
            </button>
          </div>
        </div>

        {/* Calendar Section with Conditional Display */}
        <div
          ref={calendarRef}
          id="calendar-section"
          className={`transition-all duration-500 ${isGenerated ? "opacity-100" : "opacity-0"}`}
        >
          {isGenerated && (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <h4 className="text-xl font-semibold text-black dark:text-white">
                  Your Generated Schedule
                </h4>
                {generationId && (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Generation ID: {generationId}
                  </span>
                )}
              </div>
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="mb-4 flex flex-wrap items-center justify-between">
                  <div>
                    {calendarData.length > 0 ? (
                      <p className="text-green-600 dark:text-green-400">
                        Successfully loaded {calendarData.length} scheduled task
                        {calendarData.length !== 1 ? "s" : ""}!
                      </p>
                    ) : (
                      <p className="text-yellow-600 dark:text-yellow-400">
                        No tasks were scheduled. Try selecting different tasks
                        or a different start date.
                      </p>
                    )}
                  </div>

                  {/* Accept Schedule Button */}
                  {calendarData.length > 0 && generationId && (
                    <button
                      onClick={acceptSchedule}
                      disabled={isAccepting || acceptSuccess}
                      className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                        acceptSuccess
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-brand-500 hover:bg-brand-600"
                      } flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {isAccepting ? (
                        <>
                          <svg
                            className="h-4 w-4 animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Saving...
                        </>
                      ) : acceptSuccess ? (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-4 w-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Saved to Calendar
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-4 w-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                            />
                          </svg>
                          Save to Calendar
                        </>
                      )}
                    </button>
                  )}
                </div>
                <Calendar data={calendarData} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
