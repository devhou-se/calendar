import React from 'react';
import { getLocationsForDate, getGroupDisplayName } from './locationUtils';
import { translateUI } from './translations';

/**
 * CurrentLocations component
 * Displays locations and attendees for a given date
 *
 * @param {Date} date - The date to display locations for
 * @param {Array} events - Array of event objects
 * @param {Array} members - Array of member objects with name and initials
 * @param {String} title - Optional title to display (defaults to "Current Locations")
 * @param {Boolean} useJapanese - Whether to use Japanese translations
 *
 * Colours come from the surrounding .dh[data-theme] wrapper (see theme.css).
 */
function CurrentLocations({ date, events, members, title = "Current Locations", useJapanese = false }) {
  const locations = getLocationsForDate(date, events, members);

  return (
    <section className="window">
      <h2 className="window-title">{translateUI(title, useJapanese)}</h2>
      <div className="window-body">
        {locations.length > 0 ? (
          <div className="loc-list">
            {locations.map((item, index) => (
              <div key={index} className="loc-card">
                <div className="loc-head">
                  <span className="loc-name">{getGroupDisplayName(item, useJapanese)}</span>
                  <span className="loc-count">
                    {item.count} {translateUI(item.count === 1 ? 'person' : 'people', useJapanese)}
                  </span>
                </div>
                <div className="loc-people">
                  {item.attendees.map((name, idx) => (
                    <span key={idx} className="loc-person">• {name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="loc-empty">
            {translateUI('No events scheduled for this date', useJapanese)}
          </div>
        )}
      </div>
    </section>
  );
}

export default CurrentLocations;
