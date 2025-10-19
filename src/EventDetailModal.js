import React from 'react';

const EventDetailModal = ({ event, onClose, members }) => {
  if (!event) return null;

  const isDealersChoice = event.type === 'dealers-choice';

  // Remove initials from destination (e.g., "Tokyo (BB, DT)" -> "Tokyo")
  const getCleanDestination = () => {
    const title = event.title || '';
    // Remove anything in parentheses at the end
    return title.replace(/\s*\([^)]*\)\s*$/, '').trim();
  };

  // Map initials to full names
  const getAttendeeNames = () => {
    if (!event.attendees || event.attendees.length === 0) {
      return 'N/A';
    }

    const names = event.attendees.map(initials => {
      const member = members.find(m => m.initials === initials);
      return member ? member.name : initials;
    });

    return names.join(', ');
  };

  const destination = getCleanDestination();
  const attendees = getAttendeeNames();

  return (
    <div className="event-detail-modal-backdrop" onClick={onClose}>
      <div
        className="event-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="event-detail-header">
          <h2>Event Details</h2>
          <button className="event-detail-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="event-detail-content">
          <div className="event-detail-field">
            <label>Destination</label>
            <div className="event-detail-value">{destination}</div>
          </div>

          <div className="event-detail-field">
            <label>Type</label>
            <div className="event-detail-value">
              {isDealersChoice ? "Dealer's Choice" : "devhou.se location"}
            </div>
          </div>

          <div className="event-detail-field">
            <label>Attendees</label>
            <div className="event-detail-value">{attendees}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;
