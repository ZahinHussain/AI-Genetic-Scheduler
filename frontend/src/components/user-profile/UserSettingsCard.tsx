"use client";
import React, { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";

export default function UserPreferencesCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [preferences, setPreferences] = useState({
    startTime: "08:00 AM",
    endTime: "05:00 PM",
  });

  // Fetch user preferences from the API
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch("api/settings/preferences", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch preferences");
      }
      const data = await response.json();
      setPreferences({
        startTime: data.start_time,
        endTime: data.end_time,
      });
    } catch (error) {
      console.error("Error fetching preferences:", error);
    }
  };

 // Helper function to convert "HH:MM" (24-hour) to "HH:MM AM/PM"
const formatToAmPm = (timeString24) => {
  // Basic validation: Check if input is a string and includes ':'
  if (typeof timeString24 !== 'string' || !timeString24.includes(':')) {
    console.warn("Invalid time format provided to formatToAmPm:", timeString24);
    // Return null or throw an error to indicate failure, allowing handleSave to react
    return null; 
  }

  try {
    const [hoursStr, minutesStr] = timeString24.split(':');
    let hoursNum = parseInt(hoursStr, 10);
    const minutes = minutesStr; // Keep as string with padding (e.g., "00", "30")

    // Validate parsed numbers and minutes format
    if (isNaN(hoursNum) || hoursNum < 0 || hoursNum > 23 || !/^\d{2}$/.test(minutes)) {
        console.warn("Invalid time components after parsing:", hoursStr, minutesStr);
        return null; // Indicate failure
    }

    const period = hoursNum >= 12 ? 'PM' : 'AM';
    let hours12 = hoursNum % 12;

    // Adjust hours for 12 AM (midnight) and 12 PM (noon)
    if (hours12 === 0) {
      hours12 = 12; // Midnight (00:xx) and Noon (12:xx) should display as 12
    }

    // Format hours to always have two digits (e.g., 09, 12)
    const hoursFormatted = String(hours12).padStart(2, '0');

    // Combine parts into the desired format
    return `${hoursFormatted}:${minutes} ${period}`;

  } catch (error) {
    console.error("Error formatting time:", timeString24, error);
    return null; // Indicate failure on unexpected errors
  }
};


const handleSave = async () => {
  console.log("Original Preferences state:", preferences); // Good for debugging internal state

  // --- Conversion Step ---
  const formattedStartTime = formatToAmPm(preferences.startTime);
  const formattedEndTime = formatToAmPm(preferences.endTime);

  // --- Validation Step ---
  // Check if the conversion was successful before proceeding
  if (formattedStartTime === null || formattedEndTime === null) {
      console.error("Failed to format start or end time. Aborting save.");
      // Optionally, show an error message to the user here
      alert("Invalid time format detected in preferences. Please check your settings.");
      return; // Stop the function execution
  }

  // --- Payload Preparation ---
  const payload = {
    start_time: formattedStartTime, // Use the formatted value
    end_time: formattedEndTime,   // Use the formatted value
  };

  console.log("Payload being sent to API:", payload); // Log the exact data being sent

  try {
    // --- API Call ---
    const response = await fetch("api/settings/preferences", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        // Add Authorization header if your API requires it
        // 'Authorization': `Bearer ${your_jwt_token}`
      },
      body: JSON.stringify(payload), // Send the JSON payload
    });

    // --- Response Handling ---
    if (!response.ok) {
      // Try to get more error details from the response body
      let errorDetails = `HTTP status ${response.status}`;
      try {
        const errorData = await response.text(); // Or response.json() if the API returns JSON errors
        errorDetails += ` - ${errorData}`;
      } catch (e) {
        // Ignore if reading response body fails
      }
      throw new Error(`Failed to update preferences: ${errorDetails}`);
    }

    console.log("Preferences updated successfully");
    
    // --- Post-Success Actions ---
    closeModal(); // Assuming closeModal is defined in scope
    await fetchPreferences(); // Assuming fetchPreferences is defined and fetches updated data

  } catch (error) {
    console.error("Error updating preferences:", error);
    // Optionally, display a user-friendly error message

  }
};
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-200 p-5 lg:p-6 dark:border-gray-800">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 lg:mb-6 dark:text-white/90">
              Preferences
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Start Time Preference
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {preferences.startTime}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  End Time Preference
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {preferences.endTime}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openModal}
            className="shadow-theme-xs flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-800 lg:inline-flex lg:w-auto dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            Edit
          </button>
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="m-4 max-w-[700px]">
        <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 lg:p-11 dark:bg-gray-900">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Preferences
            </h4>
            <p className="mb-6 text-sm text-gray-500 lg:mb-7 dark:text-gray-400">
              Update your time preferences.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar overflow-y-auto px-2">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Start Time Preference</Label>
                  <Input
                    type="text"
                    name="startTime"
                    value={preferences.startTime}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label>End Time Preference</Label>
                  <Input
                    type="text"
                    name="endTime"
                    value={preferences.endTime}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3 px-2 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
