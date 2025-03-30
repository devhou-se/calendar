import React, { useState } from 'react';
import { compareCalendars, loadEventsFromURL } from './diffService';
import moment from 'moment';

const CalendarDiff = ({ currentEvents, onClose }) => {
  const [comparisonUrl, setComparisonUrl] = useState('');
  const [diffResults, setDiffResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCompare = async () => {
    if (!comparisonUrl) {
      setError('Please enter a URL to compare with');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const comparisonEvents = await loadEventsFromURL(comparisonUrl);
      const results = compareCalendars(currentEvents, comparisonEvents);
      setDiffResults(results);
    } catch (err) {
      setError(`Error loading comparison calendar: ${err.message}`);
      setDiffResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const renderEventDetails = (event) => (
    <div className="event-detail" key={event.id}>
      <strong>{event.title}</strong>
      <div>
        {moment(event.start).format('MMM DD, YYYY')} - {moment(event.end).format('MMM DD, YYYY')}
      </div>
    </div>
  );

  return (
    <div className="calendar-diff">
      <h2>Compare Calendars</h2>
      <div className="diff-input">
        <input
          type="text"
          value={comparisonUrl}
          onChange={(e) => setComparisonUrl(e.target.value)}
          placeholder="Enter calendar URL to compare with current calendar"
          className="diff-url-input"
        />
        <button onClick={handleCompare} disabled={isLoading} className="compare-button">
          {isLoading ? 'Comparing...' : 'Compare'}
        </button>
      </div>

      {error && <div className="diff-error">{error}</div>}

      {diffResults && (
        <div className="diff-results">
          <div className="diff-summary">
            <h3>Calendar Comparison Summary</h3>
            <p>
              Current calendar: <strong>{diffResults.totalCurrent} events</strong><br />
              Comparison calendar: <strong>{diffResults.totalComparison} events</strong>
            </p>
            <ul className="diff-stats">
              <li><span className="added-badge">{diffResults.added.length} added</span></li>
              <li><span className="removed-badge">{diffResults.removed.length} removed</span></li>
              <li><span className="modified-badge">{diffResults.modified.length} modified</span></li>
              <li><span className="unchanged-badge">{diffResults.unchanged} unchanged</span></li>
            </ul>
          </div>

          {diffResults.added.length > 0 && (
            <div className="diff-section added">
              <h4>Added Events</h4>
              <div className="diff-events-list">
                {diffResults.added.map(renderEventDetails)}
              </div>
            </div>
          )}

          {diffResults.removed.length > 0 && (
            <div className="diff-section removed">
              <h4>Removed Events</h4>
              <div className="diff-events-list">
                {diffResults.removed.map(renderEventDetails)}
              </div>
            </div>
          )}

          {diffResults.modified.length > 0 && (
            <div className="diff-section modified">
              <h4>Modified Events</h4>
              <div className="diff-events-list">
                {diffResults.modified.map(renderEventDetails)}
              </div>
            </div>
          )}
        </div>
      )}

      <button onClick={onClose} className="close-button">Close</button>
    </div>
  );
};

export default CalendarDiff;