import React, { useState, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { useSearchParams } from 'react-router-dom';
import { generateCalendarPreview, updateMetaTags } from './previewService';
import { encodeEventsToURL, decodeEventsFromURL } from './encodingService';
import CalendarDiff from './CalendarDiff';

// Create a DnD Calendar
const DnDCalendar = withDragAndDrop(Calendar);

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

// Encoding/decoding functions moved to encodingService.js

function App() {
  // Setup URL parameters
  const [searchParams, setSearchParams] = useSearchParams();
  // State for current date/view of calendar
  const [currentDate, setCurrentDate] = useState(new Date());
  // Ref for the calendar element (used for preview generation)
  const calendarRef = useRef(null);
  // State for diff modal
  const [showDiffModal, setShowDiffModal] = useState(false);
  
  // Load events from URL or localStorage on initial render
  const loadInitialEvents = () => {
    // Check if we have events in the URL
    const encodedEvents = searchParams.get('data');
    
    let loadedEvents = [];
    if (encodedEvents) {
      // If URL has events, use those
      loadedEvents = decodeEventsFromURL(encodedEvents);
    } else {
      // Otherwise load from localStorage
      const savedEvents = localStorage.getItem('travelCalendarEvents');
      if (savedEvents) {
        try {
          // Parse the JSON string and convert date strings back to Date objects
          loadedEvents = JSON.parse(savedEvents).map(event => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end)
          }));
        } catch (e) {
          console.error('Error loading events from localStorage:', e);
        }
      }
    }
    
    // If we have events, find earliest date and set current view to that month
    if (loadedEvents.length > 0) {
      const earliestDate = loadedEvents.reduce((earliest, event) => {
        const eventStart = new Date(event.start);
        return eventStart < earliest ? eventStart : earliest;
      }, new Date(loadedEvents[0].start));
      
      // Set the calendar to show the month of the earliest event
      setCurrentDate(earliestDate);
    }
    
    return loadedEvents;
  };

  const [events, setEvents] = useState(loadInitialEvents);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: null,
    end: null
  });
  const [isCreating, setIsCreating] = useState(false);
  const [cityColors, setCityColors] = useState({});
  const [notification, setNotification] = useState(null);

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000); // Hide after 3 seconds
  };

  // Save events to localStorage and update URL whenever they change
  useEffect(() => {
    // Don't update for empty events
    if (events.length > 0 || searchParams.has('data')) {
      try {
        // Save to localStorage
        localStorage.setItem('travelCalendarEvents', JSON.stringify(events));
        
        // Update the URL
        const encodedData = encodeEventsToURL(events);
        if (encodedData) {
          setSearchParams({ data: encodedData }, { replace: true });
        } else if (searchParams.has('data')) {
          // Remove the data parameter if there are no events
          searchParams.delete('data');
          setSearchParams(searchParams, { replace: true });
        }
        
        // Only show notification when events are added or modified, not on initial load
        if (events.length && document.visibilityState === 'visible') {
          showNotification('Calendar saved and URL updated');
        }
      } catch (e) {
        console.error('Error saving events:', e);
        showNotification('Failed to save calendar data', 'error');
      }
    }
  }, [events, searchParams, setSearchParams]);

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
  
  // Generate preview image for social sharing when events change
  useEffect(() => {
    // Wait for the calendar to be rendered and stable
    const generatePreview = async () => {
      if (events.length > 0 && calendarRef.current) {
        // Give the calendar time to fully render
        setTimeout(async () => {
          try {
            // Generate preview image
            const previewImage = await generateCalendarPreview(calendarRef, events);
            if (previewImage) {
              // Update meta tags with the generated image
              updateMetaTags(previewImage);
            }
          } catch (err) {
            console.error('Error generating preview:', err);
          }
        }, 1000); // Wait 1 second for the calendar to stabilize
      }
    };
    
    generatePreview();
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

  // Handle slot selection (dragging across calendar to create a new event)
  const handleSelectSlot = ({ start, end }) => {
    setNewEvent({
      title: '',
      start,
      end
    });
    setIsCreating(true);
  };

  // Handle event selection (clicking on an existing event)
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsCreating(false);
  };

  // Save a new event
  const handleSaveEvent = (e) => {
    e.preventDefault();
    if (!newEvent.title.trim()) {
      alert('Please enter a city name');
      return;
    }

    const event = {
      id: Date.now(),
      title: newEvent.title,
      start: newEvent.start,
      end: newEvent.end,
      allDay: true // Make event all-day for better dragging UX
    };

    setEvents([...events, event]);
    setNewEvent({ title: '', start: null, end: null });
    setIsCreating(false);
  };

  // Update an existing event
  const handleUpdateEvent = (e) => {
    e.preventDefault();
    if (!selectedEvent.title.trim()) {
      alert('Please enter a city name');
      return;
    }

    const updatedEvents = events.map(event => 
      event.id === selectedEvent.id ? selectedEvent : event
    );
    setEvents(updatedEvents);
    setSelectedEvent(null);
  };

  // Delete an event
  const handleDeleteEvent = () => {
    const updatedEvents = events.filter(event => event.id !== selectedEvent.id);
    setEvents(updatedEvents);
    setSelectedEvent(null);
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
      'PRODID:-//Travel Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    // Add each event
    events.forEach(event => {
      const startDateFormatted = moment(event.start).format('YYYYMMDD[T]HHmmss');
      const endDateFormatted = moment(event.end).format('YYYYMMDD[T]HHmmss');
      
      icsContent = [
        ...icsContent,
        'BEGIN:VEVENT',
        `UID:${event.id}@travelcalendar`,
        `DTSTAMP:${moment().format('YYYYMMDD[T]HHmmss')}`,
        `DTSTART:${startDateFormatted}`,
        `DTEND:${endDateFormatted}`,
        `SUMMARY:Travel to ${event.title}`,
        `DESCRIPTION:Staying in ${event.title}`,
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
    link.download = 'travel-calendar.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle drag and drop of events
  const moveEvent = ({ event, start, end }) => {
    // Ensure we're working with dates
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const updatedEvents = events.map(existingEvent => {
      return existingEvent.id === event.id 
        ? { 
            ...existingEvent, 
            start: startDate, 
            end: endDate,
            allDay: true // Ensure the event remains all-day for consistent dragging
          }
        : existingEvent;
    });
    
    setEvents(updatedEvents);
  };
  
  // Handle resizing events (updating start or end date)
  const resizeEvent = ({ event, start, end }) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const updatedEvents = events.map(existingEvent => {
      return existingEvent.id === event.id 
        ? { 
            ...existingEvent, 
            start: startDate, 
            end: endDate,
            allDay: true // Ensure the event remains all-day for consistent dragging
          }
        : existingEvent;
    });
    
    setEvents(updatedEvents);
  };
  
  // Clear all events from the calendar
  const handleClearCalendar = () => {
    if (window.confirm('Are you sure you want to clear all events from the calendar? This action cannot be undone.')) {
      setEvents([]);
      setSelectedEvent(null);
      setIsCreating(false);
      
      // Clear localStorage
      localStorage.removeItem('travelCalendarEvents');
      
      // Clear URL parameter
      searchParams.delete('data');
      setSearchParams(searchParams, { replace: true });
      
      showNotification('Calendar cleared successfully');
    }
  };
  
  // Generate sharable link with current calendar data
  const handleShareLink = async () => {
    try {
      const encodedData = encodeEventsToURL(events);
      if (encodedData) {
        // Ensure the preview image is generated
        if (events.length > 0 && calendarRef.current) {
          try {
            const previewImage = await generateCalendarPreview(calendarRef, events);
            if (previewImage) {
              updateMetaTags(previewImage);
            }
          } catch (err) {
            console.error('Error generating preview for sharing:', err);
          }
        }
        
        // Create full URL with encoded data
        const shareableUrl = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(shareableUrl)
          .then(() => {
            showNotification('Shareable link copied to clipboard!');
          })
          .catch(err => {
            console.error('Could not copy link: ', err);
            showNotification('Failed to copy link to clipboard', 'error');
          });
      } else {
        showNotification('No events to share', 'info');
      }
    } catch (e) {
      console.error('Error generating share link:', e);
      showNotification('Error generating share link', 'error');
    }
  };

  return (
    <div className="App" style={{ padding: '20px' }}>
      <h1>Travel Calendar</h1>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div>
          <button onClick={handleClearCalendar} className="clear">
            Clear Calendar
          </button>
          
          <button onClick={() => setShowDiffModal(true)} className="diff" style={{ marginLeft: '10px' }}>
            Compare Calendars
          </button>
        </div>
        
        <div>
          <button onClick={handleShareLink} className="share" style={{ marginRight: '10px' }}>
            Share Link
          </button>
          
          <button onClick={handleExportCalendar} className="export">
            Export Calendar (ICS)
          </button>
        </div>
      </div>
      
      {/* Calendar Diff Modal */}
      {showDiffModal && (
        <CalendarDiff 
          currentEvents={events} 
          onClose={() => setShowDiffModal(false)} 
        />
      )}
      
      {/* Notification component */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {isCreating && (
        <div className="event-form">
          <h2>Add New City Visit</h2>
          <form onSubmit={handleSaveEvent}>
            <label>City Name:</label>
            <input 
              type="text" 
              value={newEvent.title} 
              onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
              placeholder="Enter city name"
              required
            />
            
            <div className="date-inputs">
              <div className="date-field">
                <label>Start Date:</label>
                <input 
                  type="date" 
                  value={moment(newEvent.start).format('YYYY-MM-DD')} 
                  onChange={(e) => {
                    const newDate = moment(e.target.value).toDate();
                    setNewEvent({
                      ...newEvent, 
                      start: newDate
                    });
                  }}
                />
              </div>
              
              <div className="date-field">
                <label>End Date:</label>
                <input 
                  type="date" 
                  value={moment(newEvent.end).format('YYYY-MM-DD')} 
                  onChange={(e) => {
                    const newDate = moment(e.target.value).toDate();
                    setNewEvent({
                      ...newEvent, 
                      end: newDate
                    });
                  }}
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit">Save</button>
              <button type="button" className="cancel" onClick={() => setIsCreating(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {selectedEvent && (
        <div className="event-form">
          <h2>Edit City Visit</h2>
          <form onSubmit={handleUpdateEvent}>
            <label>City Name:</label>
            <input 
              type="text" 
              value={selectedEvent.title} 
              onChange={(e) => setSelectedEvent({...selectedEvent, title: e.target.value})}
              placeholder="Enter city name"
              required
            />
            
            <div className="date-inputs">
              <div className="date-field">
                <label>Start Date:</label>
                <input 
                  type="date" 
                  value={moment(selectedEvent.start).format('YYYY-MM-DD')} 
                  onChange={(e) => {
                    const newDate = moment(e.target.value).toDate();
                    setSelectedEvent({
                      ...selectedEvent, 
                      start: newDate
                    });
                  }}
                />
              </div>
              
              <div className="date-field">
                <label>End Date:</label>
                <input 
                  type="date" 
                  value={moment(selectedEvent.end).format('YYYY-MM-DD')} 
                  onChange={(e) => {
                    const newDate = moment(e.target.value).toDate();
                    setSelectedEvent({
                      ...selectedEvent, 
                      end: newDate
                    });
                  }}
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit">Update</button>
              <button type="button" onClick={() => setSelectedEvent(null)} className="cancel">Cancel</button>
              <button type="button" onClick={handleDeleteEvent} className="cancel">Delete</button>
            </div>
          </form>
        </div>
      )}

      <div ref={calendarRef}>
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          selectable
          resizable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onEventDrop={moveEvent}
          onEventResize={resizeEvent}
          eventPropGetter={eventStyleGetter}
          defaultView="month"
          views={['month', 'week']}
          step={60}
          showMultiDayTimes
          popup
          style={{ height: 700 }}
          drilldownView={null}
          resizableAccessor={() => true}  // Make all events resizable
          draggableAccessor={() => true}  // Make all events draggable
          date={currentDate}
          onNavigate={date => setCurrentDate(date)}
        />
      </div>
    </div>
  );
}

export default App;