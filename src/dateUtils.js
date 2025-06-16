// Date utility functions for consistent date handling
// Convention: All dates are stored and displayed as INCLUSIVE ranges
// This means both start and end dates are part of the event duration

// Parse a date string from HTML date input (YYYY-MM-DD) to a Date object
// This ensures consistent timezone handling
export const parseDateString = (dateString) => {
  if (!dateString) return null;
  // Create date at midnight local time
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Format a Date object to YYYY-MM-DD string for HTML date input
export const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Convert an inclusive date range to exclusive (for react-big-calendar)
// react-big-calendar expects end dates to be exclusive (not included in the range)
export const toExclusiveEndDate = (endDate) => {
  if (!endDate) return null;
  const exclusive = new Date(endDate);
  exclusive.setDate(exclusive.getDate() + 1);
  return exclusive;
};

// Convert an exclusive date range to inclusive (for display/storage)
export const toInclusiveEndDate = (endDate) => {
  if (!endDate) return null;
  const inclusive = new Date(endDate);
  inclusive.setDate(inclusive.getDate() - 1);
  return inclusive;
};

// Prepare event for react-big-calendar (convert to exclusive end date)
export const prepareEventForCalendar = (event) => {
  return {
    ...event,
    end: toExclusiveEndDate(event.end)
  };
};

// Prepare event for display/editing (ensure inclusive end date)
export const prepareEventForDisplay = (event) => {
  // Since we store dates as inclusive, no conversion needed for display
  return { ...event };
};

// Prepare event for storage (ensure inclusive end date)
export const prepareEventForStorage = (event) => {
  // Events should already have inclusive dates
  return { ...event };
};

// Calculate the number of days in an event (inclusive)
export const getEventDuration = (start, end) => {
  if (!start || !end) return 0;
  const startTime = new Date(start).setHours(0, 0, 0, 0);
  const endTime = new Date(end).setHours(0, 0, 0, 0);
  const days = Math.round((endTime - startTime) / 86400000) + 1; // +1 for inclusive
  return days;
};

// Format date range for display
export const formatDateRange = (start, end) => {
  if (!start || !end) return '';
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  // If same day, show only one date
  if (startDate.toDateString() === endDate.toDateString()) {
    return startDate.toLocaleDateString();
  }
  
  return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
};

// Validate that end date is not before start date
export const validateDateRange = (start, end) => {
  if (!start || !end) return true; // Allow empty dates
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  return endTime >= startTime;
};

// Convert date to days since epoch (for URL encoding)
// We store the year, month, day as a simple day count
export const dateToDaysSinceEpoch = (date) => {
  if (!date) return 0;
  const d = new Date(date);
  // Create a date at UTC midnight for the given date
  const utc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor(utc / 86400000);
};

// Convert days since epoch to date
export const daysSinceEpochToDate = (days) => {
  if (!days && days !== 0) return null;
  // Convert back to milliseconds
  const ms = days * 86400000;
  const d = new Date(ms);
  // Create a local date with the UTC values to maintain the correct day
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};