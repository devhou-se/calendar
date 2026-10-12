import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CurrentLocations from './CurrentLocations';
import { getTodayInJST } from './locationUtils';

// Devhouse dates - same as DevhouseView
const DEVHOUSE_DATES = [
  // Core events with attendees
  {"id":1791000000001,"title":"Devhouse 3","start":"2027-02-17T13:00:00.000Z","end":"2027-03-17T13:00:00.000Z","allDay":true,"type":"core","attendees":["BB"]},

  // Other events
  {"id":1791000000002,"title":"Land","start":"2027-02-17T13:00:00.000Z","end":"2027-02-17T13:00:00.000Z","allDay":true,"type":"other"}
];

// Member information
const MEMBERS = [
  { name: 'Bailey', initials: 'BB' },
  { name: 'Damian', initials: 'DT' },
  { name: 'Dylan', initials: 'DB' },
  { name: 'Gloria', initials: 'GG' },
  { name: 'Julia', initials: 'JG' },
  { name: 'Vyv', initials: 'VB' },
  { name: 'Yashuk', initials: 'YV' }
];

/**
 * LocationsView - Standalone page for displaying current locations
 * Designed specifically for iframe embedding
 * Supports ?lang=ja or ?jp=true for Japanese translations
 * Supports ?date=YYYY-MM-DD for custom date (defaults to today in JST)
 * Supports ?theme=light or ?theme=dark for theme selection (defaults to dark)
 */
function LocationsView() {
  const [searchParams] = useSearchParams();

  // Check for Japanese language query parameter
  const useJapanese = searchParams.get('lang') === 'ja' || searchParams.get('jp') === 'true';

  // Check for theme query parameter (default to dark)
  const theme = searchParams.get('theme') === 'light' ? 'light' : 'dark';

  // Parse date parameter (format: YYYY-MM-DD)
  const getDisplayDate = () => {
    const dateParam = searchParams.get('date');

    if (dateParam) {
      // Parse YYYY-MM-DD format
      const [year, month, day] = dateParam.split('-').map(num => parseInt(num, 10));

      // Validate the date
      if (year && month && day && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const date = new Date(year, month - 1, day, 0, 0, 0, 0);

        // Check if the date is valid (e.g., not Feb 31)
        if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
          return date;
        }
      }
    }

    // Default to today in JST
    return getTodayInJST();
  };

  const displayDate = getDisplayDate();

  // Convert dates to Date objects
  const events = DEVHOUSE_DATES.map(event => ({
    ...event,
    start: new Date(event.start),
    end: new Date(event.end)
  }));

  // Update document title
  useEffect(() => {
    document.title = useJapanese ? 'devhouse - 現在の場所' : 'devhouse - current locations';
  }, [useJapanese]);

  return (
    <div className="dh locations-view" data-theme={theme}>
      <CurrentLocations
        date={displayDate}
        events={events}
        members={MEMBERS}
        useJapanese={useJapanese}
      />
    </div>
  );
}

export default LocationsView;
