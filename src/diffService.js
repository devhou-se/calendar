import { decodeEventsFromURL } from './encodingService';

// Function to compare two sets of events and identify added, removed, and modified events
export const compareCalendars = (currentEvents, comparisonEvents) => {
  if (!currentEvents || !comparisonEvents) {
    return null;
  }
  
  // Maps to store events by ID for faster lookup
  const currentEventsMap = new Map();
  currentEvents.forEach(event => currentEventsMap.set(event.id, event));
  
  const comparisonEventsMap = new Map();
  comparisonEvents.forEach(event => comparisonEventsMap.set(event.id, event));
  
  // Calculate differences
  const added = currentEvents.filter(event => !comparisonEventsMap.has(event.id));
  const removed = comparisonEvents.filter(event => !currentEventsMap.has(event.id));
  
  // Find modified events (same ID but different properties)
  const modifiedPairs = [];
  
  currentEvents.forEach(currentEvent => {
    const comparisonEvent = comparisonEventsMap.get(currentEvent.id);
    if (!comparisonEvent) return;
    
    // Check if any property is different
    const isModified = (
      currentEvent.title !== comparisonEvent.title ||
      new Date(currentEvent.start).getTime() !== new Date(comparisonEvent.start).getTime() ||
      new Date(currentEvent.end).getTime() !== new Date(comparisonEvent.end).getTime()
    );
    
    if (isModified) {
      modifiedPairs.push({
        current: currentEvent,
        comparison: comparisonEvent
      });
    }
  });
  
  return {
    added,
    removed,
    modifiedPairs,
    unchanged: currentEvents.length - added.length - modifiedPairs.length,
    totalCurrent: currentEvents.length,
    totalComparison: comparisonEvents.length
  };
};

// Load events from a URL parameter
export const loadEventsFromURL = async (url) => {
  try {
    // Extract the data parameter from the URL
    const urlObj = new URL(url);
    const encodedData = urlObj.searchParams.get('data');
    
    if (!encodedData) {
      throw new Error('No calendar data found in the URL');
    }
    
    // Use the same decoding function from App.js
    return decodeEventsFromURL(encodedData);
  } catch (error) {
    console.error('Error loading events from URL:', error);
    throw error;
  }
};