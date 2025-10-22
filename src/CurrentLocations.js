import React from 'react';
import { getLocationsForDate, getGroupDisplayName } from './locationUtils';

/**
 * CurrentLocations component
 * Displays locations and attendees for a given date
 *
 * @param {Date} date - The date to display locations for
 * @param {Array} events - Array of event objects
 * @param {Array} members - Array of member objects with name and initials
 * @param {String} title - Optional title to display (defaults to "Current Locations")
 */
function CurrentLocations({ date, events, members, title = "Current Locations", standalone = false }) {
  const locations = getLocationsForDate(date, events, members);

  return (
    <div style={{
      marginTop: standalone ? '0' : '30px',
      padding: '15px',
      backgroundColor: '#1a1a1a',
      borderRadius: '0',
      border: '2px solid #333333',
      boxShadow: '0 0 10px rgba(255, 0, 0, 0.1)',
      width: standalone ? '100%' : 'auto',
      height: standalone ? '100%' : 'auto',
      boxSizing: 'border-box'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#FF0000', fontSize: '14px' }}>
        {title}
      </h3>
      {locations.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {locations.map((item, index) => (
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
          No events scheduled for this date
        </div>
      )}
    </div>
  );
}

export default CurrentLocations;
