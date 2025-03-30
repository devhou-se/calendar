// Functions for URL encoding/decoding

// Base64URL encoding (URL-safe base64)
const toBase64URL = (str) => {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// Base64URL decoding
const fromBase64URL = (str) => {
  // Add back padding if needed
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  return atob(
    str
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      + padding
  );
};

// Encode events to a URL-safe string (optimized compact version)
export const encodeEventsToURL = (events) => {
  if (!events || events.length === 0) return '';
  
  // Check if we're using the latest version (v3) to optimize encoding
  // For new URLs, use v3 format (most compact)
  if (window.location.search === '' || !window.location.search.includes('data=')) {
    // Create a minimal representation of each event
    // Format: [i,t,s,e] where i=id, t=title, s=start days, e=end days
    const minimalEvents = events.map(event => {
      // Convert dates to Unix timestamps (in days since Jan 1, 1970)
      const s = event.start ? Math.floor(event.start.getTime() / 86400000) : 0;
      const e = event.end ? Math.floor(event.end.getTime() / 86400000) : 0;
      
      return {
        i: event.id,
        t: event.title,
        s,
        e
      };
    });
    
    // Convert to JSON and then to base64url (no double encoding)
    return 'v3:' + toBase64URL(JSON.stringify(minimalEvents));
  } else {
    // Maintain v2 format for existing URLs (backward compatibility)
    const compactEvents = events.map(event => {
      const startTime = event.start ? Math.floor(event.start.getTime() / 86400000) : 0;
      const endTime = event.end ? Math.floor(event.end.getTime() / 86400000) : 0;
      
      return [
        event.id,
        encodeURIComponent(event.title),
        startTime,
        endTime
      ].join(',');
    }).join(';');
    
    return 'v2:' + compactEvents;
  }
};

// Decode URL-safe string back to events
export const decodeEventsFromURL = (encodedData) => {
  if (!encodedData) return [];
  
  try {
    // Check for version prefix
    if (encodedData.startsWith('v3:')) {
      // Newest minimal format (v3)
      const b64Data = encodedData.substring(3); // Remove 'v3:' prefix
      const jsonString = fromBase64URL(b64Data);
      const minimalEvents = JSON.parse(jsonString);
      
      // Expand minimal events to full events
      return minimalEvents.map(evt => {
        return {
          id: evt.i,
          title: evt.t,
          start: new Date(evt.s * 86400000),
          end: new Date(evt.e * 86400000),
          allDay: true
        };
      });
    } else if (encodedData.startsWith('v2:')) {
      // Compact delimited format (v2)
      const compactData = encodedData.substring(3); // Remove 'v2:' prefix
      
      // Split into individual events
      return compactData.split(';').map(eventStr => {
        const [id, encodedTitle, startTime, endTime] = eventStr.split(',');
        
        // Convert timestamps back to Date objects
        const start = new Date(parseInt(startTime) * 86400000);
        const end = new Date(parseInt(endTime) * 86400000);
        
        return {
          id: parseInt(id),
          title: decodeURIComponent(encodedTitle),
          start,
          end,
          allDay: true
        };
      });
    } else {
      // Legacy format - maintain backward compatibility
      // Decode Base64 and URL encoding
      const jsonString = decodeURIComponent(atob(encodedData));
      const parsedEvents = JSON.parse(jsonString);
      
      // Convert ISO strings back to Date objects
      return parsedEvents.map(event => ({
        ...event,
        start: event.start ? new Date(event.start) : null,
        end: event.end ? new Date(event.end) : null
      }));
    }
  } catch (e) {
    console.error('Error decoding events from URL:', e);
    return [];
  }
};