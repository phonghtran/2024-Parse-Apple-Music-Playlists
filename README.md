# Apple Music Playlists Parser

A web application for parsing and analyzing Apple Music playlists built with Express.js and EJS, configured for Firebase App Hosting.

## Features

- Parse Apple Music XML playlist files
- Analyze music genres and track information
- Interactive web interface for data exploration
- SQLite database for data storage
- Color-coded genre visualization

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Run in development mode:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Firebase App Hosting Deployment

### Prerequisites

- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project set up
- Logged into Firebase CLI (`firebase login`)

### Deploy to Firebase App Hosting

1. Build the application:

```bash
npm run build
```

2. Deploy to Firebase:

```bash
npm run deploy
```

### Configuration

The app is configured for Firebase App Hosting with:

- **Backend ID**: `phong-music-explorer`
- **Entry point**: `server.js`
- **Node.js version**: 18
- **Environment**: Production mode with live reload disabled

### Environment Variables

Copy `.env.example` to `.env` and configure as needed:

```bash
cp .env.example .env
```

## Project Structure

- `server.js` - Main application entry point (production-ready)
- `app.js` - Original development server
- `handlers/` - Route handlers for different functionalities
- `views/` - EJS templates
- `public/` - Static assets
- `musicXML/` - Apple Music XML files for parsing
- `database.db` - SQLite database

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with live reload
- `npm run build` - Build the application
- `npm run deploy` - Deploy to Firebase App Hosting
- `npm run serve` - Serve locally using Firebase emulator

## Dependencies

### Main Dependencies

- Express.js - Web framework
- EJS - Template engine
- SQLite3 - Database
- Fast-xml-parser - XML parsing
- Axios - HTTP client

### Development Dependencies

- Nodemon - Development server with auto-reload
- Live reload - Browser refresh on file changes
- Firebase Tools - Deployment and development tools
