# Travel Calendar App

A web application that lets you create and manage your travel itinerary on a calendar interface.

## Live Demo

Check out the live app at [https://calendar.devhou.se](https://calendar.devhou.se)

## Features

- Interactive calendar view
- Click and drag to create events representing city visits
- Edit city details and dates
- Drag and resize events to adjust dates
- Export your travel calendar as an ICS file (compatible with most calendar apps)

## Getting Started

### Prerequisites

- Node.js (version 14 or later)
- npm or yarn

### Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

### Running the App

Start the development server:

```bash
npm start
```

The app will open in your default browser at [http://localhost:3000](http://localhost:3000).

## Usage

1. **Create a new event**: Click and drag across dates on the calendar
2. **Edit an event**: Click on an existing event
3. **Move an event**: Drag and drop an event to new dates
4. **Resize an event**: Drag the edges of an event to change start/end dates
5. **Export calendar**: Click the "Export Calendar (ICS)" button

## Deployment

This project is configured to automatically deploy to GitHub Pages when changes are pushed to the main branch. The deployment is handled by a GitHub Actions workflow.

### Manual Deployment

You can also manually deploy the app to GitHub Pages with:

```bash
npm run deploy
```

This will build the app and push it to the `gh-pages` branch, which is configured to be served on GitHub Pages.
