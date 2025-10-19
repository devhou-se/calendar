import React, { useState, useEffect, useCallback } from 'react';

const DateLocationModal = ({ date, events, members, onClose }) => {
  // Manage the current date internally to allow navigation
  const [currentDate, setCurrentDate] = useState(date ? new Date(date) : new Date());

  // Define calendar bounds
  const minDate = new Date(2025, 9, 26); // October 26, 2025 (month is 0-indexed)
  const maxDate = new Date(2025, 10, 22); // November 22, 2025

  // Check if current date is at bounds
  const isAtMinDate = currentDate.toDateString() === minDate.toDateString();
  const isAtMaxDate = currentDate.toDateString() === maxDate.toDateString();

  // Navigate to previous day
  const handlePreviousDay = useCallback(() => {
    if (isAtMinDate) return;
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  }, [isAtMinDate, currentDate]);

  // Navigate to next day
  const handleNextDay = useCallback(() => {
    if (isAtMaxDate) return;
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  }, [isAtMaxDate, currentDate]);

  // Listen for keyboard arrow keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePreviousDay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextDay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePreviousDay, handleNextDay]); // Re-attach listener when handlers change

  // Listen for touch swipes
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let isHorizontalSwipe = false;

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
      isHorizontalSwipe = false;
    };

    const handleTouchMove = (e) => {
      const currentX = e.changedTouches[0].screenX;
      const currentY = e.changedTouches[0].screenY;
      const deltaX = Math.abs(currentX - touchStartX);
      const deltaY = Math.abs(currentY - touchStartY);

      // Determine if this is a horizontal swipe
      if (deltaX > deltaY && deltaX > 10) {
        isHorizontalSwipe = true;
        // Only prevent default for horizontal swipes to stop background calendar movement
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;

      if (isHorizontalSwipe) {
        handleSwipe();
      }
    };

    const handleSwipe = () => {
      const swipeThreshold = 50; // Minimum distance for a swipe
      const swipeDistance = touchEndX - touchStartX;

      if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0) {
          // Swiped right -> go to previous day
          handlePreviousDay();
        } else {
          // Swiped left -> go to next day
          handleNextDay();
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handlePreviousDay, handleNextDay]); // Re-attach listener when handlers change

  if (!date) return null;

  // Format the date for display
  const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Get all locations and their attendees for the selected date
  const getLocationsForDate = () => {
    const selectedDate = new Date(currentDate);
    selectedDate.setHours(0, 0, 0, 0);

    // Step 1: Detect travelers
    const travelerMap = {}; // { initials: { from: "Tokyo", to: "Karuizawa" } }

    events.forEach(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(0, 0, 0, 0);

      if (event.attendees && event.attendees.length > 0) {
        event.attendees.forEach(initials => {
          // Check if this event is ending on selectedDate
          if (eventEnd.getTime() === selectedDate.getTime()) {
            if (!travelerMap[initials]) {
              travelerMap[initials] = {};
            }
            travelerMap[initials].from = event.title;
          }

          // Check if this event is starting on selectedDate
          if (eventStart.getTime() === selectedDate.getTime()) {
            if (!travelerMap[initials]) {
              travelerMap[initials] = {};
            }
            travelerMap[initials].to = event.title;
          }
        });
      }
    });

    // Categorize people based on their travel status
    const actualTravelers = {}; // Traveling between locations
    const arrivals = {}; // Arriving (starting a location, no departure)
    const departures = {}; // Departing (ending a location, no arrival)

    Object.keys(travelerMap).forEach(initials => {
      const travel = travelerMap[initials];

      if (travel.from && travel.to && travel.from !== travel.to) {
        // Person is traveling between different locations
        actualTravelers[initials] = travel;
      } else if (travel.to && !travel.from) {
        // Person is arriving (starting a location, no departure)
        arrivals[initials] = { location: travel.to };
      } else if (travel.from && !travel.to) {
        // Person is departing (ending a location, no arrival)
        departures[initials] = { location: travel.from };
      }
    });

    // Step 2: Create travel groups (grouped by route)
    const travelGroupMap = {}; // { "Tokyo → Karuizawa": Set of initials }
    Object.keys(actualTravelers).forEach(initials => {
      const { from, to } = actualTravelers[initials];
      const route = `${from} → ${to}`;

      if (!travelGroupMap[route]) {
        travelGroupMap[route] = new Set();
      }
      travelGroupMap[route].add(initials);
    });

    const travelGroups = Object.entries(travelGroupMap).map(([route, initialsSet]) => {
      const attendeeNames = Array.from(initialsSet).map(initials => {
        const member = members.find(m => m.initials === initials);
        return member ? member.name : initials;
      });

      return {
        type: 'travel',
        route,
        attendees: attendeeNames,
        count: attendeeNames.length
      };
    });

    // Step 2b: Create arrival groups (grouped by destination)
    const arrivalGroupMap = {}; // { "Karuizawa": Set of initials }
    Object.keys(arrivals).forEach(initials => {
      const { location } = arrivals[initials];

      if (!arrivalGroupMap[location]) {
        arrivalGroupMap[location] = new Set();
      }
      arrivalGroupMap[location].add(initials);
    });

    const arrivalGroups = Object.entries(arrivalGroupMap).map(([location, initialsSet]) => {
      const attendeeNames = Array.from(initialsSet).map(initials => {
        const member = members.find(m => m.initials === initials);
        return member ? member.name : initials;
      });

      return {
        type: 'arrival',
        location,
        attendees: attendeeNames,
        count: attendeeNames.length
      };
    });

    // Step 2c: Create departure groups (grouped by origin)
    const departureGroupMap = {}; // { "Tokyo": Set of initials }
    Object.keys(departures).forEach(initials => {
      const { location } = departures[initials];

      if (!departureGroupMap[location]) {
        departureGroupMap[location] = new Set();
      }
      departureGroupMap[location].add(initials);
    });

    const departureGroups = Object.entries(departureGroupMap).map(([location, initialsSet]) => {
      const attendeeNames = Array.from(initialsSet).map(initials => {
        const member = members.find(m => m.initials === initials);
        return member ? member.name : initials;
      });

      return {
        type: 'departure',
        location,
        attendees: attendeeNames,
        count: attendeeNames.length
      };
    });

    // Step 3: Create location groups (excluding travelers, arrivals, and departures)
    const locationMap = {};

    events.forEach(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(23, 59, 59, 999);

      // Check if the event is active on the selected date
      if (eventStart <= selectedDate && eventEnd >= selectedDate) {
        const location = event.title;

        // Initialize location if not exists
        if (!locationMap[location]) {
          locationMap[location] = new Set();
        }

        // Add attendees if they exist and are NOT in any special category
        if (event.attendees && event.attendees.length > 0) {
          event.attendees.forEach(initials => {
            if (!actualTravelers[initials] && !arrivals[initials] && !departures[initials]) {
              locationMap[location].add(initials);
            }
          });
        }
      }
    });

    const locationGroups = Object.entries(locationMap).map(([location, initialsSet]) => {
      const attendeeNames = Array.from(initialsSet).map(initials => {
        const member = members.find(m => m.initials === initials);
        return member ? member.name : initials;
      });

      return {
        type: 'location',
        location,
        attendees: attendeeNames,
        count: attendeeNames.length
      };
    }).filter(group => group.count > 0); // Filter out empty location groups

    // Step 4: Combine and sort all groups
    const allGroups = [...travelGroups, ...arrivalGroups, ...departureGroups, ...locationGroups];

    allGroups.sort((a, b) => {
      // First by count (descending)
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      // Then alphabetically by route/location
      let aName, bName;
      if (a.type === 'travel') {
        aName = a.route;
      } else if (a.type === 'arrival') {
        aName = `Arriving in ${a.location}`;
      } else if (a.type === 'departure') {
        aName = `Departing ${a.location}`;
      } else {
        aName = a.location;
      }

      if (b.type === 'travel') {
        bName = b.route;
      } else if (b.type === 'arrival') {
        bName = `Arriving in ${b.location}`;
      } else if (b.type === 'departure') {
        bName = `Departing ${b.location}`;
      } else {
        bName = b.location;
      }

      return aName.localeCompare(bName);
    });

    return allGroups;
  };

  const locations = getLocationsForDate();

  return (
    <div className="event-detail-modal-backdrop" onClick={onClose}>
      <div
        className="event-detail-modal date-location-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="event-detail-header">
          <button
            className="date-nav-arrow"
            onClick={handlePreviousDay}
            disabled={isAtMinDate}
          >
            ←
          </button>
          <h2>Locations for {formatDate(currentDate)}</h2>
          <button
            className="date-nav-arrow"
            onClick={handleNextDay}
            disabled={isAtMaxDate}
          >
            →
          </button>
          <button className="event-detail-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="event-detail-content">
          {locations.length > 0 ? (
            <div className="location-groups">
              {locations.map((item, index) => {
                // Determine the display name based on item type
                let displayName;
                if (item.type === 'travel') {
                  displayName = item.route;
                } else if (item.type === 'arrival') {
                  displayName = `Arriving in ${item.location}`;
                } else if (item.type === 'departure') {
                  displayName = `Departing ${item.location}`;
                } else {
                  displayName = item.location;
                }

                return (
                  <div key={index} className="location-group">
                    <div className="location-header">
                      <span className="location-name">
                        {displayName}
                      </span>
                      <span className="location-count">
                        {item.count} {item.count === 1 ? 'person' : 'people'}
                      </span>
                    </div>
                    <div className="location-attendees">
                      {item.attendees.map((name, idx) => (
                        <div key={idx} className="attendee-item">
                          • {name}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-locations">
              No events scheduled for this date
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DateLocationModal;
