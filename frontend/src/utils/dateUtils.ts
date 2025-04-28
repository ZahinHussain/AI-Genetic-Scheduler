import { format, addDays, parse, isValid } from "date-fns";

/**
 * Format a date to a string using the specified format
 * @param date The date to format
 * @param formatString The format string (default: MM/dd/yyyy)
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date,
  formatString: string = "MM/dd/yyyy",
): string => {
  try {
    return format(date, formatString);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

/**
 * Get today's date formatted as a string
 * @param formatString The format string (default: MM/dd/yyyy)
 * @returns Today's date formatted as a string
 */
export const getTodayFormatted = (
  formatString: string = "MM/dd/yyyy",
): string => {
  return formatDate(new Date(), formatString);
};

/**
 * Get tomorrow's date formatted as a string
 * @param formatString The format string (default: MM/dd/yyyy)
 * @returns Tomorrow's date formatted as a string
 */
export const getTomorrowFormatted = (
  formatString: string = "MM/dd/yyyy",
): string => {
  const tomorrow = addDays(new Date(), 1);
  return formatDate(tomorrow, formatString);
};

/**
 * Parse a date string to a Date object
 * @param dateString The date string to parse
 * @param formatString The format of the date string
 * @returns A Date object or null if invalid
 */
export const parseDate = (
  dateString: string,
  formatString: string = "MM/dd/yyyy",
): Date | null => {
  try {
    const parsedDate = parse(dateString, formatString, new Date());
    return isValid(parsedDate) ? parsedDate : null;
  } catch (error) {
    console.error("Error parsing date:", error);
    return null;
  }
};

/**
 * Get current time formatted as HH:mm
 * @returns Current time as a string in 24-hour format
 */
export const getCurrentTime = (): string => {
  return format(new Date(), "HH:mm");
};
