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

// Define colors for event types (darker for better text readability)
const EVENT_COLORS = {
  'core': '#00897B',          // Darker teal for core events with attendees
  'dealers-choice': '#F57C00', // Darker orange for dealer's choice
  'other': '#8E24AA'           // Darker purple for other events (Land, Leave, custom)
};

// Devhouse dates
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

// Calendar overlay component to capture clicks on dates
const CalendarOverlay = ({ currentDate, onDateClick }) => {
  const overlayRef = React.useRef(null);
  const [visibleWeeks, setVisibleWeeks] = React.useState(6);

  // Track touch/mouse movement to distinguish between tap/click and scroll/drag
  const touchStartPos = React.useRef({ x: 0, y: 0 });
  const hasMoved = React.useRef(false);

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

  // Handle touch start - record initial position
  const handleTouchStart = (e) => {
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
    hasMoved.current = false;
  };

  // Handle touch move - track if user is scrolling
  const handleTouchMove = (e) => {
    const moveThreshold = 10; // pixels
    const deltaX = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartPos.current.y);

    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      hasMoved.current = true;
    }
  };

  // Handle mouse down - record initial position
  const handleMouseDown = (e) => {
    touchStartPos.current = {
      x: e.clientX,
      y: e.clientY
    };
    hasMoved.current = false;
  };

  // Handle mouse move - track if user is dragging
  const handleMouseMove = (e) => {
    const moveThreshold = 10; // pixels
    const deltaX = Math.abs(e.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(e.clientY - touchStartPos.current.y);

    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      hasMoved.current = true;
    }
  };

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
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onClick={(e) => {
                      // Only trigger if there was no significant movement
                      if (!hasMoved.current) {
                        onDateClick(date);
                      }
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={(e) => {
                      // Only trigger if there was no significant movement
                      if (!hasMoved.current) {
                        e.preventDefault();
                        onDateClick(date);
                      }
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
          // Show events only if they include selected attendees
          if (event.attendees && event.attendees.length > 0) {
            return event.attendees.some(attendee => selectedAttendees.includes(attendee));
          }
          return false;
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

  // Function to get event style based on type
  const eventStyleGetter = (event) => {
    const backgroundColor = EVENT_COLORS[event.type] || EVENT_COLORS['other'];
    return {
      style: {
        backgroundColor,
        borderRadius: '0',
        opacity: 0.9,
        color: 'white',
        border: '2px solid rgba(0, 0, 0, 0.3)',
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
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          border: '2px solid #FF0000',
          boxShadow: 'inset 0 0 10px rgba(255, 0, 0, 0.3)'
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
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
        <img
          src="/logo-white.svg"
          alt="devhouse logo"
          style={{ height: '60px', filter: 'drop-shadow(0 0 5px rgba(255, 0, 0, 0.3))' }}
        />
        <h1 style={{ margin: 0 }}>calendar</h1>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', marginRight: '5px' }}>Filter:</span>
          <button
            onClick={() => setSelectedAttendees([])}
            style={{
              padding: '8px 16px',
              borderRadius: '0',
              border: selectedAttendees.length === 0 ? '2px solid #FF0000' : '2px solid #333333',
              backgroundColor: selectedAttendees.length === 0 ? '#FF0000' : '#1a1a1a',
              color: selectedAttendees.length === 0 ? 'white' : '#ffffff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: selectedAttendees.length === 0 ? 'bold' : 'normal',
              transition: 'all 0.2s'
            }}
          >
            All
          </button>
          {MEMBERS.map(member => (
            <button
              key={member.initials}
              onClick={() => toggleAttendee(member.initials)}
              style={{
                padding: '8px 16px',
                borderRadius: '0',
                border: selectedAttendees.includes(member.initials) ? '2px solid #FF0000' : '2px solid #333333',
                backgroundColor: selectedAttendees.includes(member.initials) ? '#FF0000' : '#1a1a1a',
                color: selectedAttendees.includes(member.initials) ? 'white' : '#ffffff',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: selectedAttendees.includes(member.initials) ? 'bold' : 'normal',
                transition: 'all 0.2s'
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
        padding: '15px',
        backgroundColor: '#1a1a1a',
        borderRadius: '0',
        border: '2px solid #333333',
        boxShadow: '0 0 10px rgba(255, 0, 0, 0.1)'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#FF0000', fontSize: '14px' }}>
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
                backgroundColor: '#0a0a0a',
                borderRadius: '0',
                border: '2px solid #333333',
                boxShadow: '0 0 5px rgba(255, 0, 0, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontWeight: 'bold', color: '#FF0000', fontSize: '15px' }}>
                    {getGroupDisplayName(item)}
                  </span>
                  <span style={{ color: '#cccccc', fontSize: '13px' }}>
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
                    <span key={idx} style={{ color: '#dddddd', fontSize: '14px' }}>
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
