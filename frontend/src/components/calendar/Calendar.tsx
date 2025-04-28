"use client";
import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  EventInput,
  DateSelectArg,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string; // Will be 'Primary', 'Success', 'Warning', 'Danger'
  };
}

interface CalendarProps {
  data: {
    description: string;
    title: string;
    scheduled_start: string;
    scheduled_end: string;
  }[];
}

// Define color mappings using Tailwind classes for better visibility
const calendarsEvents = {
  Primary: { bgClass: "bg-blue-500", textClass: "text-white" },
  Success: { bgClass: "bg-green-500", textClass: "text-white" },
  Warning: { bgClass: "bg-yellow-500", textClass: "text-black" }, // Use black text for yellow bg
  Danger: { bgClass: "bg-red-600", textClass: "text-white" }, // Slightly darker red
};

const Calendar: React.FC<CalendarProps> = ({ data }) => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] =
    useState<keyof typeof calendarsEvents>("Primary"); // Default to Primary
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    if (data && data.length > 0) {
      const mappedEvents: CalendarEvent[] = data.map((item, index) => ({
        id: (index + 1).toString(),
        title: item.title,
        start: item.scheduled_start,
        end: item.scheduled_end,
        // Default all incoming data to 'Primary' or map based on some data property if available
        extendedProps: { calendar: "Primary" },
      }));
      setEvents(mappedEvents);
    }
  }, [data]);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    setEventStartDate(selectInfo.startStr);
    // If endStr is not provided (day click), use startStr for end date as well
    setEventEndDate(selectInfo.endStr || selectInfo.startStr);
    // Default new events to 'Primary'
    setEventLevel("Primary");
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent(event as unknown as CalendarEvent);
    setEventTitle(event.title);
    // Format dates for input type="date" (YYYY-MM-DD)
    setEventStartDate(
      event.start ? event.start.toISOString().split("T")[0] : "",
    );
    // Handle potential null end date, default to start date if needed
    setEventEndDate(
      event.end
        ? event.end.toISOString().split("T")[0]
        : event.start
          ? event.start.toISOString().split("T")[0]
          : "",
    );
    setEventLevel(
      (event.extendedProps.calendar as keyof typeof calendarsEvents) ||
        "Primary",
    );
    openModal();
  };

  const handleAddOrUpdateEvent = () => {
    // Basic validation
    if (!eventTitle || !eventStartDate || !eventLevel) {
      // Optionally, add user feedback here (e.g., using a toast notification)
      console.error("Missing required event fields");
      return;
    }

    // Ensure end date is not before start date
    const start = new Date(eventStartDate);
    const end = eventEndDate ? new Date(eventEndDate) : start; // Use start if end is empty
    if (end < start) {
      // Optionally, add user feedback
      console.error("End date cannot be before start date");
      return;
    }
    // Adjust end date for allDay events if necessary (FullCalendar convention)
    // If start and end date are the same for an all-day event, FullCalendar might not display it correctly
    // If it's a single day event, often no end date is needed, or it's the *next* day for exclusive end times.
    // For simplicity with date inputs, we'll keep them as selected.
    const finalEndDate = eventEndDate || eventStartDate; // Use start date if end date is empty

    if (selectedEvent) {
      // Update existing event
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === selectedEvent.id
            ? {
                ...event,
                title: eventTitle,
                start: eventStartDate,
                end: finalEndDate, // Use potentially adjusted end date
                allDay: true, // Assuming date inputs mean all day
                extendedProps: { calendar: eventLevel },
              }
            : event,
        ),
      );
    } else {
      // Add new event
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: eventTitle,
        start: eventStartDate,
        end: finalEndDate, // Use potentially adjusted end date
        allDay: true, // Assuming date inputs mean all day
        extendedProps: { calendar: eventLevel },
      };
      setEvents((prevEvents) => [...prevEvents, newEvent]);
    }
    closeModal();
    resetModalFields();
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel("Primary"); // Reset level to default
    setSelectedEvent(null);
  };

  // Function to render event content with improved colors
  const renderEventContent = (eventInfo: EventContentArg) => {
    const calendarType = (eventInfo.event.extendedProps.calendar ||
      "Primary") as keyof typeof calendarsEvents;
    const colorInfo = calendarsEvents[calendarType] || calendarsEvents.Primary; // Fallback to Primary

    return (
      <div
        className={`h-full w-full ${colorInfo.bgClass} ${colorInfo.textClass} flex items-center overflow-hidden rounded-sm p-1 text-xs`}
      >
        {/* Optionally add dot back if needed: <div className="w-2 h-2 rounded-full bg-current mr-1"></div> */}
        <b className="fc-event-time mr-1">{eventInfo.timeText}</b>
        <span className="fc-event-title flex-1 truncate">
          {eventInfo.event.title}
        </span>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Apply custom styles to override default FullCalendar event colors if necessary */}
      <style jsx global>{`
        /* Remove default background/border colors from FullCalendar events */
        .fc-event {
          background-color: transparent !important;
          border: none !important;
        }
        /* Ensure our custom render takes full space */
        .fc-event-main-frame {
          display: block; /* Or contents if needed */
        }
        .fc-daygrid-event-harness,
        .fc-timegrid-event-harness {
          padding: 1px !important; /* Minimal padding around harness */
        }
        .fc .fc-daygrid-event {
          margin-bottom: 2px !important; /* Adjust spacing between events */
        }
        /* Style the radio button preview */
        .event-color-preview {
          display: inline-block;
          width: 1rem; /* 16px */
          height: 1rem; /* 16px */
          margin-right: 0.5rem; /* 8px */
          border-radius: 50%;
          border: 1px solid rgba(0, 0, 0, 0.2); /* Subtle border */
        }
      `}</style>
      <div className="custom-calendar p-4">
        {" "}
        {/* Add some padding */}
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next addEventButton",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          selectable={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventContent={renderEventContent} // Use custom render function
          customButtons={{
            addEventButton: {
              text: "Add Event +",
              click: () => {
                // Ensure modal is reset for 'Add Event' button
                resetModalFields();
                setEventLevel("Primary"); // Explicitly set default level
                openModal();
              },
            },
          }}
          // Ensure events are rendered as background blocks if needed, or standard otherwise
          // eventDisplay='block' // Default, good for day/week grid
          // eventDisplay='list-item' // Alternative for month view if needed
          dayMaxEventRows={true} // Handle too many events in month view
          views={{
            dayGridMonth: {
              dayMaxEventRows: 4, // Limit rows in month view
            },
          }}
        />
      </div>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[700px] p-6 lg:p-10"
      >
        <div className="custom-scrollbar flex flex-col overflow-y-auto px-2">
          <div>
            <h5 className="modal-title text-theme-xl mb-2 font-semibold text-gray-800 lg:text-2xl dark:text-white/90">
              {selectedEvent ? "Edit Event" : "Add Event"}
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedEvent
                ? "Update the details for this event."
                : "Plan your next big moment: schedule an event to stay on track."}
            </p>
          </div>
          <div className="mt-8">
            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                htmlFor="event-title"
              >
                Event Title
              </label>
              <input
                id="event-title"
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                required
              />
            </div>

            <div className="mt-6">
              <label className="mb-4 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Event Color
              </label>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                {" "}
                {/* Adjust gap */}
                {Object.entries(calendarsEvents).map(([key, value]) => (
                  <div key={key}>
                    <label
                      className="flex cursor-pointer items-center text-sm text-gray-700 dark:text-gray-400"
                      htmlFor={`modal${key}`}
                    >
                      <input
                        type="radio"
                        name="event-level"
                        value={key}
                        id={`modal${key}`}
                        checked={eventLevel === key}
                        onChange={() =>
                          setEventLevel(key as keyof typeof calendarsEvents)
                        }
                        className="peer sr-only" // Hide default radio, use peer for styling
                      />
                      {/* Custom radio button appearance */}
                      <span
                        className={`event-color-preview ${value.bgClass}`}
                      ></span>{" "}
                      {/* Colored circle */}
                      <span className="peer-checked:font-semibold">
                        {key}
                      </span>{" "}
                      {/* Highlight text when checked */}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {" "}
              {/* Layout dates side-by-side on larger screens */}
              <div>
                <label
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                  htmlFor="event-start-date"
                >
                  Start Date
                </label>
                <input
                  id="event-start-date"
                  type="date"
                  value={eventStartDate}
                  onChange={(e) => setEventStartDate(e.target.value)}
                  className="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  required
                />
              </div>
              <div>
                <label
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                  htmlFor="event-end-date"
                >
                  End Date (optional)
                </label>
                <input
                  id="event-end-date"
                  type="date"
                  value={eventEndDate}
                  onChange={(e) => setEventEndDate(e.target.value)}
                  min={eventStartDate} // Prevent end date being before start date
                  className="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3 sm:justify-end">
            {" "}
            {/* Increased margin-top */}
            <button
              onClick={closeModal}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
            >
              Cancel {/* Changed from Close for better UX */}
            </button>
            <button
              onClick={handleAddOrUpdateEvent}
              type="button"
              className="bg-brand-500 hover:bg-brand-600 flex w-full justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 sm:w-auto"
              disabled={!eventTitle || !eventStartDate} // Disable button if required fields missing
            >
              {selectedEvent ? "Update Event" : "Add Event"}{" "}
              {/* More specific text */}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Calendar;
