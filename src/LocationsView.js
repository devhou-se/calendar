import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CurrentLocations from './CurrentLocations';
import { getTodayInJST } from './locationUtils';

// Devhouse dates - same as DevhouseView
const DEVHOUSE_DATES = [
  // Core events with attendees
  {"id":1743312030622,"title":"Sendai","start":"2025-10-25T13:00:00.000Z","end":"2025-10-29T13:00:00.000Z","allDay":true,"type":"core","attendees":["BB","DB","DT","JG","YV"]},
  {"id":1743311975675,"title":"Tokyo","start":"2025-10-29T13:00:00.000Z","end":"2025-10-31T13:00:00.000Z","allDay":true,"type":"core","attendees":["BB","DB","DT","GG","JG","VB","YV"]},
  {"id":1743312066182,"title":"Fukuoka","start":"2025-11-07T13:00:00.000Z","end":"2025-11-11T13:00:00.000Z","allDay":true,"type":"core","attendees":["BB","DB","DT","JG","YV"]},
  {"id":1757817492179,"title":"Okayama","start":"2025-11-11T13:00:00.000Z","end":"2025-11-12T13:00:00.000Z","allDay":true,"type":"core","attendees":["BB","DB","DT","YV"]},
  {"id":1743312070472,"title":"Osaka","start":"2025-11-12T13:00:00.000Z","end":"2025-11-16T13:00:00.000Z","allDay":true,"type":"core","attendees":["BB","DB","DT","YV"]},

  // Other events (no attendees)
  {"id":1743313244238,"title":"Land","start":"2025-10-25T13:00:00.000Z","end":"2025-10-25T13:00:00.000Z","allDay":true,"type":"other"},
  {"id":1743312089552,"title":"Leave","start":"2025-11-16T13:00:00.000Z","end":"2025-11-16T13:00:00.000Z","allDay":true,"type":"other"},

  // Dealer's choice events
  {"id":1700000001,"title":"Karuizawa","start":"2025-10-31T13:00:00.000Z","end":"2025-11-01T13:00:00.000Z","allDay":true,"type":"dealers-choice","attendees":["DT","JG"]},
  {"id":1700000002,"title":"Osaka","start":"2025-10-31T13:00:00.000Z","end":"2025-11-01T13:00:00.000Z","allDay":true,"type":"dealers-choice","attendees":["DB"]},
  {"id":1700000003,"title":"Tokyo","start":"2025-10-31T13:00:00.000Z","end":"2025-11-04T13:00:00.000Z","allDay":true,"type":"dealers-choice","attendees":["BB","GG","VB","YV"]},
  {"id":1700000004,"title":"Otsu","start":"2025-11-01T13:00:00.000Z","end":"2025-11-02T13:00:00.000Z","allDay":true,"type":"dealers-choice","attendees":["DB"]},
  {"id":1700000005,"title":"Toyama","start":"2025-11-01T13:00:00.000Z","end":"2025-11-03T13:00:00.000Z","allDay":true,"type":"dealers-choice","attendees":["DT","JG"]},
  {"id":1700000006,"title":"Higashiomi","start":"2025-11-02T13:00:00.000Z","end":"2025-11-03T13:00:00.000Z","allDay":true,"type":"dealers-choice","attendees":["DB"]},
  {"id":1700000007,"title":"Nagahama","start":"2025-11-03T13:00:00.000Z","end":"2025-11-04T13:00:00.000Z","allDay":true,"type":"dealers-choice","attendees":["DB"]},
  {"id":1700000008,"title":"Shirakawa-Go","start":"2025-11-03T13:00:00.000Z","end":"2025-11-04T13:00:00.000Z","allDay":true,"type":"dealers-choice","attendees":["DT","JG"]},
  {"id":1700000009,"title":"Kanazawa","start":"2025-11-04T13:00:00.000Z","end":"2025-11-07T13:00:00.000Z","allDay":true,"type":"dealers-choice","attendees":["BB","DT","GG","JG","YV"]},
  {"id":1700000010,"title":"Tsuruga","start":"2025-11-04T13:00:00.000Z","end":"2025-11-05T13:00:00.000Z","allDay":true,"type":"dealers-choice","attendees":["DB"]},
  {"id":1700000011,"title":"Takashima","start":"2025-11-05T13:00:00.000Z","end":"2025-11-06T13:00:00.000Z","allDay":true,"type":"dealers-choice","attendees":["DB"]},
  {"id":1700000012,"title":"Otsu","start":"2025-11-06T13:00:00.000Z","end":"2025-11-07T13:00:00.000Z","allDay":true,"type":"dealers-choice","attendees":["DB"]}
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
 */
function LocationsView() {
  const [searchParams] = useSearchParams();

  // Check for Japanese language query parameter
  const useJapanese = searchParams.get('lang') === 'ja' || searchParams.get('jp') === 'true';

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
    <div style={{
      padding: '0',
      backgroundColor: '#0a0a0a',
      width: '100%',
      height: '100vh',
      color: '#ffffff',
      boxSizing: 'border-box'
    }}>
      <CurrentLocations
        date={displayDate}
        events={events}
        members={MEMBERS}
        standalone={true}
        useJapanese={useJapanese}
      />
    </div>
  );
}

export default LocationsView;
