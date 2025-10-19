import React, { useState, useEffect, useCallback } from 'react';
import { getLocationsForDate, getGroupDisplayName } from './locationUtils';

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

  const locations = getLocationsForDate(currentDate, events, members);

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
              {locations.map((item, index) => (
                <div key={index} className="location-group">
                  <div className="location-header">
                    <span className="location-name">
                      {getGroupDisplayName(item)}
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
              ))}
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
