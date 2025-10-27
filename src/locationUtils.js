// Utility functions for grouping locations and attendees by date
import { translateLocation, translateUI } from './translations';

/**
 * Get all locations and their attendees for a specific date
 * Groups people into travelers, arrivals, departures, and static locations
 *
 * @param {Date} selectedDate - The date to get locations for
 * @param {Array} events - Array of event objects with start, end, title, attendees
 * @param {Array} members - Array of member objects with name and initials
 * @returns {Array} Array of location/travel groups with attendees
 */
export const getLocationsForDate = (selectedDate, events, members) => {
  const date = new Date(selectedDate);
  date.setHours(0, 0, 0, 0);

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
        if (eventEnd.getTime() === date.getTime()) {
          if (!travelerMap[initials]) {
            travelerMap[initials] = {};
          }
          travelerMap[initials].from = event.title;
        }

        // Check if this event is starting on selectedDate
        if (eventStart.getTime() === date.getTime()) {
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
    if (eventStart <= date && eventEnd >= date) {
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
    const aName = getGroupDisplayName(a);
    const bName = getGroupDisplayName(b);
    return aName.localeCompare(bName);
  });

  return allGroups;
};

/**
 * Get display name for a location group
 * @param {Object} group - Location group with type and location/route
 * @param {Boolean} useJapanese - Whether to use Japanese translations
 * @returns {String} Display name for the group
 */
export const getGroupDisplayName = (group, useJapanese = false) => {
  if (group.type === 'travel') {
    // For travel routes, translate both locations
    const [from, to] = group.route.split(' → ');
    const translatedFrom = translateLocation(from.trim(), useJapanese);
    const translatedTo = translateLocation(to.trim(), useJapanese);
    return `${translatedFrom} → ${translatedTo}`;
  } else if (group.type === 'arrival') {
    const translatedLocation = translateLocation(group.location, useJapanese);
    const arrivingText = translateUI('Arriving in', useJapanese);
    return `${arrivingText} ${translatedLocation}`;
  } else if (group.type === 'departure') {
    const translatedLocation = translateLocation(group.location, useJapanese);
    const departingText = translateUI('Departing', useJapanese);
    return `${departingText} ${translatedLocation}`;
  } else {
    return translateLocation(group.location, useJapanese);
  }
};

/**
 * Get today's date in JST timezone
 * @returns {Date} Today's date with hours set to 00:00:00
 */
export const getTodayInJST = () => {
  const now = new Date();
  const jstDateString = now.toLocaleDateString('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const [month, day, year] = jstDateString.split('/');
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};
