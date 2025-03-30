// Functions for URL encoding/decoding

// Encode events to a URL-safe string
export const encodeEventsToURL = (events) => {
  if (!events || events.length === 0) return '';
  
  // Convert dates to ISO strings before serializing
  const serializedEvents = events.map(event => ({
    ...event,
    start: event.start ? event.start.toISOString() : null,
    end: event.end ? event.end.toISOString() : null
  }));
  
  // Serialize to JSON and compress
  const jsonString = JSON.stringify(serializedEvents);
  // Use Base64 encoding for URL safety, but also handle special chars
  return btoa(encodeURIComponent(jsonString));
};

// Decode URL-safe string back to events
export const decodeEventsFromURL = (encodedData) => {
  if (!encodedData) return [];
  
  try {
    // Decode Base64 and URL encoding
    const jsonString = decodeURIComponent(atob(encodedData));
    const parsedEvents = JSON.parse(jsonString);
    
    // Convert ISO strings back to Date objects
    return parsedEvents.map(event => ({
      ...event,
      start: event.start ? new Date(event.start) : null,
      end: event.end ? new Date(event.end) : null
    }));
  } catch (e) {
    console.error('Error decoding events from URL:', e);
    return [];
  }
};