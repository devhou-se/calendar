import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { prepareEventForCalendar } from './dateUtils';
import { getLocationsForDate, getGroupDisplayName, getTodayInJST } from './locationUtils';
import DateLocationModal from './DateLocationModal';

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

// Define a set of colors for events
const CITY_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#FF9F1C', // Orange
  '#6A0572', // Purple
  '#1A936F', // Green
  '#3D5A80', // Navy
  '#E84855', // Coral
  '#3185FC', // Blue
  '#FFBF69', // Yellow
  '#7D4E57', // Mauve
  '#3C91E6', // Bright Blue
  '#2EC4B6', // Turquoise
];

// Devhouse dates
const DEVHOUSE_DATES = [
  // Core events
  {"id":1743313244238,"title":"Land","start":"2025-10-25T13:00:00.000Z","end":"2025-10-25T13:00:00.000Z","allDay":true,"type":"core"},
  {"id":1743312030622,"title":"Sendai","start":"2025-10-25T13:00:00.000Z","end":"2025-10-29T13:00:00.000Z","allDay":true,"type":"core","attendees":["BB","DB","DT","JG","YV"]},
  {"id":1743311975675,"title":"Tokyo","start":"2025-10-29T13:00:00.000Z","end":"2025-10-31T13:00:00.000Z","allDay":true,"type":"core","attendees":["BB","DB","DT","GG","JG","VB","YV"]},
  {"id":1743312066182,"title":"Fukuoka","start":"2025-11-07T13:00:00.000Z","end":"2025-11-11T13:00:00.000Z","allDay":true,"type":"core","attendees":["BB","DB","DT","JG","YV"]},
  {"id":1757817492179,"title":"Okayama","start":"2025-11-11T13:00:00.000Z","end":"2025-11-12T13:00:00.000Z","allDay":true,"type":"core","attendees":["BB","DB","DT","YV"]},
  {"id":1743312070472,"title":"Osaka","start":"2025-11-12T13:00:00.000Z","end":"2025-11-16T13:00:00.000Z","allDay":true,"type":"core","attendees":["BB","DB","DT","YV"]},
  {"id":1743312089552,"title":"Leave","start":"2025-11-16T13:00:00.000Z","end":"2025-11-16T13:00:00.000Z","allDay":true,"type":"core"},

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

// Calendar overlay component to capture clicks on dates
const CalendarOverlay = ({ currentDate, onDateClick }) => {
  const overlayRef = React.useRef(null);
  const [visibleWeeks, setVisibleWeeks] = React.useState(6);

  // Get the calendar dates
  const getCalendarDates = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Get the day of week for the first day
    const firstDayOfWeek = firstDay.getDay();

    // Calculate start date (include previous month days)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDayOfWeek);

    // Always create 42 dates (6 weeks)
    const dates = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  const dates = getCalendarDates();

  // Detect how many weeks are actually visible in the calendar
  React.useEffect(() => {
    const checkVisibleWeeks = () => {
      const monthRows = document.querySelectorAll('.rbc-month-row');
      const visible = Array.from(monthRows).filter(row => row.offsetHeight > 0).length;
      if (visible > 0 && visible !== visibleWeeks) {
        setVisibleWeeks(visible);
      }
    };

    // Check after render
    setTimeout(checkVisibleWeeks, 0);
  }, [currentDate, visibleWeeks]);

  return (
    <div
      ref={overlayRef}
      className="calendar-click-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      {/* Match calendar structure exactly */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}>
        {/* Header spacer */}
        <div style={{
          minHeight: '0px',
          height: 'auto',
        }}>
          <div className="rbc-header" style={{ visibility: 'hidden', pointerEvents: 'none' }}>
            <span>Sun</span>
          </div>
        </div>

        {/* Month content */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Create overlay rows only for visible weeks */}
          {[...Array(visibleWeeks)].map((_, weekIndex) => (
            <div
              key={`week-${weekIndex}`}
              style={{
                flex: 1,
                display: 'flex',
                minHeight: 0,
              }}
            >
              {/* 7 days per week */}
              {[...Array(7)].map((_, dayIndex) => {
                const dateIndex = weekIndex * 7 + dayIndex;
                const date = dates[dateIndex];
                return (
                  <div
                    key={`day-${dateIndex}`}
                    onClick={() => onDateClick(date)}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      onDateClick(date);
                    }}
                    style={{
                      flex: 1,
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                      backgroundColor: 'transparent',
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function DevhouseView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Redirect to editor if ?data= parameter is present
  useEffect(() => {
    const encodedEvents = searchParams.get('data');
    if (encodedEvents) {
      navigate(`/editor?data=${encodedEvents}`, { replace: true });
    }
  }, [searchParams, navigate]);

  // Load events from URL or use default devhouse dates
  const loadInitialEvents = () => {
    // Always use devhouse dates for the main view (redirect happens if ?data= is present)
    return DEVHOUSE_DATES.map(event => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end)
    }));
  };

  const [events] = useState(loadInitialEvents);
  const [cityColors, setCityColors] = useState({});
  const [currentDate] = useState(new Date(2025, 10, 1)); // November 2025
  const [selectedAttendees, setSelectedAttendees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);

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

  // Filter events based on selected attendees
  const getFilteredEvents = () => {
    const filtered = selectedAttendees.length === 0
      ? events
      : events.filter(event => {
          // Always show core events
          if (event.type === 'core') return true;
          // Show dealer's choice events only if they include selected attendees
          if (event.type === 'dealers-choice' && event.attendees) {
            return event.attendees.some(attendee => selectedAttendees.includes(attendee));
          }
          return true;
        });

    // Sort so dealer's choice events render first, then core events
    return filtered.sort((a, b) => {
      if (a.type === 'dealers-choice' && b.type === 'core') return -1;
      if (a.type === 'core' && b.type === 'dealers-choice') return 1;
      return 0;
    });
  };

  const filteredEvents = getFilteredEvents();

  // Toggle attendee selection
  const toggleAttendee = (initials) => {
    setSelectedAttendees(prev =>
      prev.includes(initials)
        ? prev.filter(a => a !== initials)
        : [...prev, initials]
    );
  };

  // Handle date click from overlay
  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowDateModal(true);
  };

  // Handle date modal close
  const handleCloseDateModal = () => {
    setShowDateModal(false);
    setSelectedDate(null);
  };

  // Assign colors to cities
  useEffect(() => {
    const cities = {};
    let colorIndex = 0;

    events.forEach(event => {
      if (!cities[event.title]) {
        cities[event.title] = CITY_COLORS[colorIndex % CITY_COLORS.length];
        colorIndex++;
      }
    });

    setCityColors(cities);
  }, [events]);

  // Function to get event style based on city
  const eventStyleGetter = (event) => {
    const backgroundColor = cityColors[event.title] || '#3174ad';
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        minHeight: '24px',
        lineHeight: '1.2'
      }
    };
  };

  // Function to highlight today's date
  const dayPropGetter = (date) => {
    const isToday = date.toDateString() === getTodayInJST().toDateString();

    if (isToday) {
      return {
        style: {
          backgroundColor: '#fff3cd',
          border: '2px solid #ffc107'
        }
      };
    }
    return {};
  };

  // Export calendar as ICS file
  const handleExportCalendar = () => {
    if (events.length === 0) {
      alert('No events to export');
      return;
    }

    // Generate ICS content manually
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//DevHouse Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    // Add each event
    events.forEach(event => {
      const startDateFormatted = moment(event.start).format('YYYYMMDD[T]HHmmss');
      // ICS format expects exclusive end dates, so add one day to our inclusive end date
      const exclusiveEnd = new Date(event.end);
      exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
      const endDateFormatted = moment(exclusiveEnd).format('YYYYMMDD[T]HHmmss');

      icsContent = [
        ...icsContent,
        'BEGIN:VEVENT',
        `UID:${event.id}@devhousecalendar`,
        `DTSTAMP:${moment().format('YYYYMMDD[T]HHmmss')}`,
        `DTSTART:${startDateFormatted}`,
        `DTEND:${endDateFormatted}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.title}`,
        `LOCATION:${event.title}`,
        'END:VEVENT'
      ];
    });

    // Close calendar
    icsContent.push('END:VCALENDAR');

    // Join with CRLF as per RFC 5545
    const icsString = icsContent.join('\r\n');

    // Create and download the file
    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'devhouse-calendar.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Get today's locations using shared utility
  const getTodayLocations = () => {
    return getLocationsForDate(getTodayInJST(), events, MEMBERS);
  };

  // Update document title
  useEffect(() => {
    document.title = 'devhouse calendar';
  }, []);

  return (
    <div className="App devhouse-view" style={{ padding: '20px' }}>
      <h1>devhouse calendar</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', marginRight: '5px' }}>Filter:</span>
          <button
            onClick={() => setSelectedAttendees([])}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: selectedAttendees.length === 0 ? '2px solid #2196F3' : '1px solid #ccc',
              backgroundColor: selectedAttendees.length === 0 ? '#2196F3' : 'white',
              color: selectedAttendees.length === 0 ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: selectedAttendees.length === 0 ? 'bold' : 'normal'
            }}
          >
            All
          </button>
          {MEMBERS.map(member => (
            <button
              key={member.initials}
              onClick={() => toggleAttendee(member.initials)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: selectedAttendees.includes(member.initials) ? '2px solid #2196F3' : '1px solid #ccc',
                backgroundColor: selectedAttendees.includes(member.initials) ? '#2196F3' : 'white',
                color: selectedAttendees.includes(member.initials) ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: selectedAttendees.includes(member.initials) ? 'bold' : 'normal'
              }}
            >
              {member.name}
            </button>
          ))}
        </div>
        <button onClick={handleExportCalendar} className="export">
          Export Calendar (ICS)
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <Calendar
          localizer={localizer}
          events={filteredEvents.map(prepareEventForCalendar)}
          startAccessor="start"
          endAccessor="end"
          eventPropGetter={eventStyleGetter}
          dayPropGetter={dayPropGetter}
          defaultView="month"
          views={['month']}
          toolbar={false}
          showAllEvents={true}
          style={{ height: 900 }}
          drilldownView={null}
          date={currentDate}
          onNavigate={() => {}} // Disable navigation
        />
        {/* Overlay grid to capture clicks */}
        <CalendarOverlay currentDate={currentDate} onDateClick={handleDateClick} />
      </div>

      {/* Current Location Tracker */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>
          Current Locations
        </h3>
        {getTodayLocations().length > 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            {getTodayLocations().map((item, index) => (
              <div key={index} style={{
                padding: '12px 15px',
                backgroundColor: 'white',
                borderRadius: '5px',
                border: '1px solid #ccc'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontWeight: 'bold', color: '#2196F3', fontSize: '15px' }}>
                    {getGroupDisplayName(item)}
                  </span>
                  <span style={{ color: '#666', fontSize: '13px' }}>
                    {item.count} {item.count === 1 ? 'person' : 'people'}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  paddingLeft: '10px'
                }}>
                  {item.attendees.map((name, idx) => (
                    <span key={idx} style={{ color: '#555', fontSize: '14px' }}>
                      • {name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
            No events scheduled for today
          </div>
        )}
      </div>

      {/* Event Detail Modal - Disabled, using date modal instead */}
      {/* {showEventModal && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={handleCloseModal}
          members={MEMBERS}
        />
      )} */}

      {/* Date Location Modal */}
      {showDateModal && selectedDate && (
        <DateLocationModal
          date={selectedDate}
          events={events}
          members={MEMBERS}
          onClose={handleCloseDateModal}
        />
      )}
    </div>
  );
}

export default DevhouseView;
