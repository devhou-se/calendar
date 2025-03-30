import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup localizer
const localizer = momentLocalizer(moment);

const CalendarVisualDiff = ({ currentEvents, comparisonEvents, onClose }) => {
  const [viewType, setViewType] = useState('unified'); // unified, split, overlay
  
  // Combine all events for the unified and overlay views
  const getUnifiedEvents = () => {
    if (!currentEvents || !comparisonEvents) return [];
    
    // Create a map of all events by ID for easier lookup
    const eventsMap = new Map();
    
    // Process current events first (your events)
    currentEvents.forEach(event => {
      eventsMap.set(event.id, {
        ...event,
        type: 'current',
        title: `${event.title} (Your)`,
        originalEvent: event
      });
    });
    
    // Then process comparison events, marking any overlaps as "modified"
    comparisonEvents.forEach(event => {
      if (eventsMap.has(event.id)) {
        // This is a modified event
        const currentEvent = eventsMap.get(event.id);
        const isModified = 
          currentEvent.originalEvent.title !== event.title ||
          new Date(currentEvent.originalEvent.start).getTime() !== new Date(event.start).getTime() ||
          new Date(currentEvent.originalEvent.end).getTime() !== new Date(event.end).getTime();
          
        if (isModified) {
          eventsMap.set(event.id, {
            ...currentEvent,
            type: 'modified',
            modifiedEvent: event,
            title: `${currentEvent.originalEvent.title} (Modified)`
          });
        }
      } else {
        // This is a removed event
        eventsMap.set(event.id, {
          ...event,
          type: 'removed',
          title: `${event.title} (Other)`,
          originalEvent: event
        });
      }
    });
    
    // For overlay view, add the comparison events as separate entries
    if (viewType === 'overlay') {
      comparisonEvents.forEach(event => {
        const currentEvent = eventsMap.get(event.id);
        if (currentEvent && currentEvent.type === 'modified') {
          // Add the comparison version of this modified event
          eventsMap.set(`${event.id}-comparison`, {
            ...event,
            id: `${event.id}-comparison`,
            type: 'comparison',
            title: `${event.title} (Other)`,
            originalEvent: event
          });
        }
      });
    }
    
    return Array.from(eventsMap.values());
  };
  
  // Get events for the split view (separate columns)
  const getSplitEvents = () => {
    if (!currentEvents || !comparisonEvents) return [];
    
    const yourEvents = currentEvents.map(event => ({
      ...event,
      type: 'current',
      title: `${event.title} (Your)`
    }));
    
    const otherEvents = comparisonEvents.map(event => ({
      ...event,
      type: 'removed',
      title: `${event.title} (Other)`
    }));
    
    // For visual clarity in split view, we mark modified events specifically
    const modifiedMap = new Map();
    
    currentEvents.forEach(currentEvent => {
      comparisonEvents.forEach(compEvent => {
        if (currentEvent.id === compEvent.id) {
          const isModified = 
            currentEvent.title !== compEvent.title ||
            new Date(currentEvent.start).getTime() !== new Date(compEvent.start).getTime() ||
            new Date(currentEvent.end).getTime() !== new Date(compEvent.end).getTime();
            
          if (isModified) {
            modifiedMap.set(currentEvent.id, true);
          }
        }
      });
    });
    
    // Update the types for modified events
    yourEvents.forEach(event => {
      if (modifiedMap.has(event.id)) {
        event.type = 'modified';
        event.title = `${event.title.replace(' (Your)', '')} (Modified)`;
      }
    });
    
    // Mark the comparison events that were modified
    otherEvents.forEach(event => {
      if (modifiedMap.has(event.id)) {
        event.type = 'comparison';
      }
    });
    
    return [...yourEvents, ...otherEvents];
  };
  
  // Get the appropriate events based on the current view type
  const getEvents = () => {
    if (viewType === 'split') {
      return getSplitEvents();
    } else {
      return getUnifiedEvents();
    }
  };
  
  // Style events based on their type
  const eventStyleGetter = (event) => {
    let style = {
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      display: 'block',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      padding: '2px 5px'
    };
    
    switch (event.type) {
      case 'current':
        // Your events - green
        style.backgroundColor = '#4CAF50';
        break;
      case 'removed':
        // Other's unique events - red
        style.backgroundColor = '#F44336'; 
        break;
      case 'modified':
        // Modified events - enhanced visual design to show both versions side-by-side
        style.backgroundColor = 'white';
        style.border = '2px solid #FF5722';
        // Remove background image for cleaner look with side-by-side content
        style.backgroundImage = 'none';
        style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
        style.color = 'black';
        // Add more height to accommodate the side-by-side comparison
        style.height = 'auto';
        style.minHeight = '36px';
        // Add padding for better spacing
        style.padding = '0';
        // Ensure the element is on top of other events
        style.zIndex = 50;
        // Allow content to be visible
        style.overflow = 'visible';
        // Remove text shadow for cleaner text
        style.textShadow = 'none';
        break;
      case 'comparison':
        // Other version of modified events - blue
        style.backgroundColor = '#2196F3';
        style.border = '2px solid #1976D2';
        break;
      case 'modified-wrapper':
        // Special wrapper for modified events - transparent with dashed border
        style.backgroundColor = 'transparent';
        style.border = '2px dashed #FF5722';
        style.height = '100%';
        style.padding = '0';
        break;
      default:
        style.backgroundColor = '#9E9E9E';
    }
    
    return { style };
  };
  
  // Custom toolbar to add toggle buttons
  const CustomToolbar = (toolbar) => {
    const goToToday = () => {
      toolbar.onNavigate('TODAY');
    };
    
    const goToPrev = () => {
      toolbar.onNavigate('PREV');
    };
    
    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };
    
    const changeView = (view) => {
      toolbar.onView(view);
    };
    
    return (
      <div className="diff-toolbar">
        <div className="diff-toolbar-navigation">
          <button type="button" onClick={goToToday}>Today</button>
          <button type="button" onClick={goToPrev}>&lt;</button>
          <span className="diff-toolbar-label">{toolbar.label}</span>
          <button type="button" onClick={goToNext}>&gt;</button>
          
          <div className="diff-toolbar-views">
            <button 
              type="button" 
              className={toolbar.view === 'month' ? 'active' : ''} 
              onClick={() => changeView('month')}
            >
              Month
            </button>
            <button 
              type="button" 
              className={toolbar.view === 'week' ? 'active' : ''} 
              onClick={() => changeView('week')}
            >
              Week
            </button>
          </div>
        </div>
        
        <div className="diff-toolbar-options">
          <div className="diff-view-toggle">
            <button 
              className={viewType === 'unified' ? 'active' : ''} 
              onClick={() => setViewType('unified')}
            >
              Unified
            </button>
            <button 
              className={viewType === 'split' ? 'active' : ''} 
              onClick={() => setViewType('split')}
            >
              All Events
            </button>
            <button 
              className={viewType === 'overlay' ? 'active' : ''} 
              onClick={() => setViewType('overlay')}
            >
              Overlay
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Custom event component to show more details
  const EventComponent = ({ event }) => {
    let className = 'calendar-diff-event';
    if (event.type) {
      className += ` ${event.type}-event`;
    }
    
    // For modified events, show a special display with both versions
    if (event.type === 'modified' && event.modifiedEvent) {
      const origTitle = event.originalEvent.title.split(' (')[0];
      const modTitle = event.modifiedEvent.title.split(' (')[0];
      
      // Determine what changed
      const titleChanged = origTitle !== modTitle;
      const startChanged = new Date(event.originalEvent.start).getTime() !== new Date(event.modifiedEvent.start).getTime();
      const endChanged = new Date(event.originalEvent.end).getTime() !== new Date(event.modifiedEvent.end).getTime();
      
      const origStart = moment(event.originalEvent.start).format('MMM DD');
      const modStart = moment(event.modifiedEvent.start).format('MMM DD');
      const origEnd = moment(event.originalEvent.end).format('MMM DD');
      const modEnd = moment(event.modifiedEvent.end).format('MMM DD');

      // Create a side-by-side visual representation
      return (
        <div className={className}>
          <div className="event-comparison-container">
            <div className="event-side original">
              <div className="event-side-title">{origTitle}</div>
              <div className="event-side-dates">{origStart} - {origEnd}</div>
            </div>
            
            <div className="event-changes-divider">
              <div className="change-arrows">
                {titleChanged && <span className="arrow-icon">→</span>}
                {startChanged && <span className="arrow-icon">→</span>}
                {endChanged && <span className="arrow-icon">→</span>}
              </div>
            </div>
            
            <div className="event-side modified">
              <div className="event-side-title">{modTitle}</div>
              <div className="event-side-dates">{modStart} - {modEnd}</div>
            </div>
          </div>
        </div>
      );
    }
    
    // Default display for non-modified events
    return (
      <div className={className}>
        <div className="event-title">{event.title.split(' (')[0]}</div>
      </div>
    );
  };
  
  // Custom tooltip component for events
  const EventTooltip = ({ event }) => {
    if (!event) return null;
    
    // Extract the original title without the suffix
    const title = event.title.split(' (')[0];
    
    // Return different tooltip content based on event type
    switch (event.type) {
      case 'current':
        return (
          <div className="event-tooltip your-event">
            <div className="tooltip-title">{title}</div>
            <div className="tooltip-dates">
              {moment(event.start).format('MMM DD, YYYY')} - {moment(event.end).format('MMM DD, YYYY')}
            </div>
            <div className="tooltip-type">Your Event</div>
          </div>
        );
      case 'removed':
        return (
          <div className="event-tooltip other-event">
            <div className="tooltip-title">{title}</div>
            <div className="tooltip-dates">
              {moment(event.start).format('MMM DD, YYYY')} - {moment(event.end).format('MMM DD, YYYY')}
            </div>
            <div className="tooltip-type">Other Calendar Only</div>
          </div>
        );
      case 'modified':
        // For modified events, show both versions with clear highlighting of changes
        if (event.modifiedEvent && event.originalEvent) {
          const origTitle = event.originalEvent.title.split(' (')[0];
          const modTitle = event.modifiedEvent.title.split(' (')[0];
          
          // Determine what changed
          const titleChanged = origTitle !== modTitle;
          const startChanged = new Date(event.originalEvent.start).getTime() !== new Date(event.modifiedEvent.start).getTime();
          const endChanged = new Date(event.originalEvent.end).getTime() !== new Date(event.modifiedEvent.end).getTime();
          
          return (
            <div className="event-tooltip modified-event">
              <div className="tooltip-title">
                Modified Event: {origTitle}
              </div>
              
              {titleChanged && (
                <div className="tooltip-changes">
                  <div className="tooltip-change-title">City Name Changed:</div>
                  <div className="tooltip-change-row">
                    <div className="change-from">From: <span className="highlight">{origTitle}</span></div>
                    <div className="change-to">To: <span className="highlight">{modTitle}</span></div>
                  </div>
                </div>
              )}
              
              {startChanged && (
                <div className="tooltip-changes">
                  <div className="tooltip-change-title">Start Date Changed:</div>
                  <div className="tooltip-change-row">
                    <div className="change-from">From: <span className="highlight">{moment(event.originalEvent.start).format('MMM DD, YYYY')}</span></div>
                    <div className="change-to">To: <span className="highlight">{moment(event.modifiedEvent.start).format('MMM DD, YYYY')}</span></div>
                  </div>
                </div>
              )}
              
              {endChanged && (
                <div className="tooltip-changes">
                  <div className="tooltip-change-title">End Date Changed:</div>
                  <div className="tooltip-change-row">
                    <div className="change-from">From: <span className="highlight">{moment(event.originalEvent.end).format('MMM DD, YYYY')}</span></div>
                    <div className="change-to">To: <span className="highlight">{moment(event.modifiedEvent.end).format('MMM DD, YYYY')}</span></div>
                  </div>
                </div>
              )}
              
              <div className="events-visual-comparison">
                <div className="events-comparison-title">Visual Comparison:</div>
                <div className="events-side-by-side">
                  <div className="event-comparison-box original">
                    <div className="event-box-header">Original Event</div>
                    <div className="event-box-content">
                      <div className="event-box-title">{origTitle}</div>
                      <div className="event-box-dates">
                        <div className="event-date">
                          <span className="date-label">From:</span>
                          <span className="date-value">{moment(event.originalEvent.start).format('MMM DD, YYYY')}</span>
                        </div>
                        <div className="event-date">
                          <span className="date-label">To:</span>
                          <span className="date-value">{moment(event.originalEvent.end).format('MMM DD, YYYY')}</span>
                        </div>
                        <div className="event-duration">
                          <span className="duration-label">Duration:</span>
                          <span className="duration-value">{moment(event.originalEvent.end).diff(moment(event.originalEvent.start), 'days')} days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="event-comparison-arrows">
                    {titleChanged && <div className="comparison-arrow title-arrow">→</div>}
                    {startChanged && <div className="comparison-arrow start-arrow">→</div>}
                    {endChanged && <div className="comparison-arrow end-arrow">→</div>}
                  </div>
                  
                  <div className="event-comparison-box modified">
                    <div className="event-box-header">Modified Event</div>
                    <div className="event-box-content">
                      <div className="event-box-title">{modTitle}</div>
                      <div className="event-box-dates">
                        <div className="event-date">
                          <span className="date-label">From:</span>
                          <span className="date-value">{moment(event.modifiedEvent.start).format('MMM DD, YYYY')}</span>
                        </div>
                        <div className="event-date">
                          <span className="date-label">To:</span>
                          <span className="date-value">{moment(event.modifiedEvent.end).format('MMM DD, YYYY')}</span>
                        </div>
                        <div className="event-duration">
                          <span className="duration-label">Duration:</span>
                          <span className="duration-value">{moment(event.modifiedEvent.end).diff(moment(event.modifiedEvent.start), 'days')} days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="tooltip-summary">
                <div className="tooltip-summary-title">Summary of Changes:</div>
                <ul className="tooltip-summary-list">
                  {titleChanged && <li>City name changed from "<span className="highlight">{origTitle}</span>" to "<span className="highlight">{modTitle}</span>"</li>}
                  {startChanged && <li>Start date moved from <span className="highlight">{moment(event.originalEvent.start).format('MMM DD, YYYY')}</span> to <span className="highlight">{moment(event.modifiedEvent.start).format('MMM DD, YYYY')}</span></li>}
                  {endChanged && <li>End date moved from <span className="highlight">{moment(event.originalEvent.end).format('MMM DD, YYYY')}</span> to <span className="highlight">{moment(event.modifiedEvent.end).format('MMM DD, YYYY')}</span></li>}
                  
                  {startChanged || endChanged ? (
                    <li>
                      Duration changed from <span className="highlight">{moment(event.originalEvent.end).diff(moment(event.originalEvent.start), 'days')} days</span> to <span className="highlight">{moment(event.modifiedEvent.end).diff(moment(event.modifiedEvent.start), 'days')} days</span>
                    </li>
                  ) : null}
                </ul>
              </div>
            </div>
          );
        }
        return null;
        
      case 'comparison':
        return (
          <div className="event-tooltip comparison-event">
            <div className="tooltip-title">{title}</div>
            <div className="tooltip-dates">
              {moment(event.start).format('MMM DD, YYYY')} - {moment(event.end).format('MMM DD, YYYY')}
            </div>
            <div className="tooltip-type">Other Version (Modified)</div>
          </div>
        );
      default:
        return null;
    }
  };
  
  // Legend component for the calendar
  const Legend = () => (
    <div className="diff-legend">
      <div className="legend-title">Legend:</div>
      <div className="legend-items">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#4CAF50' }}></div>
          <div className="legend-label">Your Events</div>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#F44336' }}></div>
          <div className="legend-label">Other Calendar Only</div>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#FF9800' }}></div>
          <div className="legend-label">Modified Events</div>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#2196F3' }}></div>
          <div className="legend-label">Other Version (Modified)</div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="calendar-visual-diff">
      <h2>Calendar Visual Comparison</h2>
      
      <Legend />
      
      <div className="calendar-container">
        <Calendar
          localizer={localizer}
          events={getEvents()}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          eventPropGetter={eventStyleGetter}
          components={{
            toolbar: CustomToolbar,
            event: EventComponent,
            eventWrapper: props => (
              <div title={props.event.title}>
                {props.children}
              </div>
            ),
            eventContainerWrapper: props => (
              <div className="event-container-wrapper">
                {props.children}
              </div>
            ),
            // Custom tooltip component
            eventOverlay: ({ event }) => <EventTooltip event={event} />
          }}
          popup
          tooltipAccessor={null}
          onSelectEvent={(event) => {
            console.log('Selected event:', event);
          }}
        />
      </div>
      
      <div className="diff-controls">
        <button onClick={onClose} className="close-button">Back to Text Diff</button>
      </div>
    </div>
  );
};

export default CalendarVisualDiff;