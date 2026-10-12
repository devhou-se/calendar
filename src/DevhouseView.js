import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { prepareEventForCalendar, parseDateString } from './dateUtils';
import { getTodayInJST } from './locationUtils';
import DateLocationModal from './DateLocationModal';
import CurrentLocations from './CurrentLocations';
import useTheme from './useTheme';

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

// Event type -> CSS class (colours come from the blog palette in theme.css)
const EVENT_CLASSES = {
  'core': 'ev-core',
  'dealers-choice': 'ev-dealer',
  'other': 'ev-other'
};

// Months the trip spans - month navigation is clamped to these
const FIRST_MONTH = new Date(2027, 1, 1); // February 2027
const LAST_MONTH = new Date(2027, 1, 1);  // February 2027

// Devhouse dates
const DEVHOUSE_DATES = [
  // Core events with attendees
  // openEndedFor: attendees whose end date isn't known yet (never shown as departing)
  {"id":1791000000001,"title":"Devhouse 3","start":"2027-02-18","end":"2027-02-28","allDay":true,"type":"core","attendees":["BB","DT"],"openEndedFor":["DT"]},

  // Other events
  {"id":1791000000002,"title":"Land","start":"2027-02-18","end":"2027-02-18","allDay":true,"type":"other"}
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
    const moveThreshold = 15; // pixels
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
    const moveThreshold = 15; // pixels
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
      start: parseDateString(event.start),
      end: parseDateString(event.end)
    }));
  };

  const [events] = useState(loadInitialEvents);
  const [currentDate, setCurrentDate] = useState(FIRST_MONTH);
  const { theme, toggleTheme } = useTheme();
  const [selectedAttendees, setSelectedAttendees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);

  // Member information
  const MEMBERS = [
    { name: 'Bailey', initials: 'BB' },
    { name: 'Damian', initials: 'DT' },
    { name: 'Dylan', initials: 'DB' }
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

  // Function to get event class based on type
  const eventStyleGetter = (event) => ({
    className: EVENT_CLASSES[event.type] || EVENT_CLASSES['other']
  });

  // Month navigation (clamped to the trip)
  const shiftMonth = (delta) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };
  const isFirstMonth = currentDate.getTime() <= FIRST_MONTH.getTime();
  const isLastMonth = currentDate.getTime() >= LAST_MONTH.getTime();
  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Function to highlight today's date
  const dayPropGetter = (date) => (
    date.toDateString() === getTodayInJST().toDateString() ? { className: 'is-today' } : {}
  );

  // Update document title
  useEffect(() => {
    document.title = 'devhouse calendar';
  }, []);

  return (
    <div className="dh devhouse-view" data-theme={theme}>
      <header className="hud">
        <div className="hud-left">
          <a href="https://devhou.se" className="hud-home">
            <img src="/logo-white.svg" alt="devhou.se" className="hud-logo" />
            <span className="hud-word">calendar.devhou.se</span>
          </a>
          <span className="hud-sep">│</span>
          <span className="hud-crumb hud-loc">devhouse 3</span>
          <span className="hud-sep">│</span>
          <span className="hud-crumb">{monthLabel}</span>
        </div>
        <div className="hud-right">
          <button type="button" className="hud-btn" onClick={toggleTheme} title="Toggle theme (T)">
            {theme === 'dark' ? '☀ DAY' : '☾ NIGHT'}
          </button>
        </div>
      </header>

      <main className="stage">
        <section className="window">
          <h2 className="window-title">Party</h2>
          <div className="window-body">
            <div className="chips">
              <button
                type="button"
                className={`chip${selectedAttendees.length === 0 ? ' active' : ''}`}
                onClick={() => setSelectedAttendees([])}
              >
                All
              </button>
              {MEMBERS.map(member => (
                <button
                  type="button"
                  key={member.initials}
                  className={`chip${selectedAttendees.includes(member.initials) ? ' active' : ''}`}
                  onClick={() => toggleAttendee(member.initials)}
                >
                  {member.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="window">
          <h2 className="window-title">
            {monthLabel}
            <span className="spacer" />
            <button type="button" className="nav-btn" onClick={() => shiftMonth(-1)} disabled={isFirstMonth} aria-label="Previous month">◀</button>
            <button type="button" className="nav-btn" onClick={() => shiftMonth(1)} disabled={isLastMonth} aria-label="Next month">▶</button>
          </h2>
          <div className="window-body">
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
                onNavigate={() => {}} // Navigation is driven by the window title buttons
              />
              {/* Overlay grid to capture clicks */}
              <CalendarOverlay currentDate={currentDate} onDateClick={handleDateClick} />
            </div>
            <div className="legend">
              <span style={{ '--swatch': 'var(--ev-core)' }}>Core</span>
              <span style={{ '--swatch': 'var(--ev-dealer)' }}>Dealer's choice</span>
              <span style={{ '--swatch': 'var(--ev-other)' }}>Travel</span>
            </div>
          </div>
        </section>

        {/* Current Location Tracker */}
        <CurrentLocations
          date={getTodayInJST()}
          events={events}
          members={MEMBERS}
        />
      </main>

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
