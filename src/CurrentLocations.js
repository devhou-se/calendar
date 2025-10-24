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
 * @param {Boolean} standalone - Whether to use standalone styling
 * @param {Boolean} useJapanese - Whether to use Japanese translations
 * @param {String} theme - Theme to use ('light' or 'dark', defaults to 'dark')
 */
function CurrentLocations({ date, events, members, title = "Current Locations", standalone = false, useJapanese = false, theme = 'dark' }) {
  const locations = getLocationsForDate(date, events, members);

  // Theme configuration based on www-jp styling
  const themes = {
    dark: {
      containerBg: '#1a1a1a',
      containerBorder: '#333333',
      containerShadow: '0 0 10px rgba(255, 0, 0, 0.1)',
      itemBg: '#0a0a0a',
      itemBorder: '#333333',
      itemShadow: '0 0 5px rgba(255, 0, 0, 0.1)',
      titleColor: '#FF0000',
      primaryText: '#FF0000',
      secondaryText: '#cccccc',
      tertiaryText: '#dddddd',
      noEventText: '#999999'
    },
    light: {
      containerBg: '#ffffff',
      containerBorder: '#d0d0d0',
      containerShadow: '0 0 10px rgba(0, 0, 0, 0.05)',
      itemBg: '#f5f5f5',
      itemBorder: '#d0d0d0',
      itemShadow: '0 0 5px rgba(0, 0, 0, 0.05)',
      titleColor: '#FF0000',
      primaryText: '#FF0000',
      secondaryText: '#666666',
      tertiaryText: '#555555',
      noEventText: '#999999'
    }
  };

  const colors = themes[theme] || themes.dark;

  return (
    <div style={{
      marginTop: standalone ? '0' : '30px',
      padding: '15px',
      backgroundColor: colors.containerBg,
      borderRadius: '0',
      border: `2px solid ${colors.containerBorder}`,
      boxShadow: colors.containerShadow,
      width: standalone ? '100%' : 'auto',
      height: standalone ? '100%' : 'auto',
      boxSizing: 'border-box'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '15px', color: colors.titleColor, fontSize: '14px' }}>
        {translateUI(title, useJapanese)}
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
              backgroundColor: colors.itemBg,
              borderRadius: '0',
              border: `2px solid ${colors.itemBorder}`,
              boxShadow: colors.itemShadow
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontWeight: 'bold', color: colors.primaryText, fontSize: '15px' }}>
                  {getGroupDisplayName(item, useJapanese)}
                </span>
                <span style={{ color: colors.secondaryText, fontSize: '13px' }}>
                  {item.count} {translateUI(item.count === 1 ? 'person' : 'people', useJapanese)}
                </span>
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                paddingLeft: '10px'
              }}>
                {item.attendees.map((name, idx) => (
                  <span key={idx} style={{ color: colors.tertiaryText, fontSize: '14px' }}>
                    • {name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: colors.noEventText, padding: '20px' }}>
          {translateUI('No events scheduled for this date', useJapanese)}
        </div>
      )}
    </div>
  );
}

export default CurrentLocations;
