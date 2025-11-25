# ZZZ Server

Backend server for Zenless Zone Zero achievement tracking application.

## Features

- SQLite database for data persistence
- REST API for data synchronization
- Token-based access control
- Automatic data backup

## Installation

```bash
cd server
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your authentication token:
   ```env
   PORT=3000
   AUTH_TOKEN=your-secret-token-here
   ```

**Important**: Change `AUTH_TOKEN` to a secure token before deploying!

## Running the Server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

The server will start on `http://localhost:3000` by default.

Server will display: `Server will only accept requests with token: {your-token}`

## Environment Variables

- `PORT` - Server port (default: 3000)
- `AUTH_TOKEN` - Authentication token (default: 'default')

## API Endpoints

All endpoints require the token in the URL path: `/{token}/api/*`

### User Info

- `GET /:token/api/userinfo` - Get all users
- `POST /:token/api/userinfo` - Add new user
- `PUT /:token/api/userinfo/:tokenId` - Update user info
- `DELETE /:token/api/userinfo/:tokenId` - Delete user

### Achievement Data

- `GET /:token/api/achievement/:uid` - Get achievement data for user
- `POST /:token/api/achievement/:uid` - Save achievement data for user

### Textjoin Data

- `GET /:token/api/textjoin/:uid` - Get textjoin data for user
- `POST /:token/api/textjoin/:uid` - Save textjoin data for user

### Custom Not Achieved Data

- `GET /:token/api/custom-not-achieved/:uid` - Get custom not achieved data for user
- `POST /:token/api/custom-not-achieved/:uid` - Save custom not achieved data for user

### Sync

- `GET /:token/api/sync` - Get all data from server
- `POST /:token/api/sync` - Push all data to server

## Token Authentication

The server validates all requests against the `AUTH_TOKEN` configured in `.env`.

- Requests with incorrect token receive `403 Forbidden`
- Requests without token receive `401 Unauthorized`
- Frontend must use the same token configured on the server

## Database

The server uses SQLite with the following tables:

- `user_info` - User account information
- `user_achievement` - Achievement progress data
- `user_textjoin` - Text join settings
- `user_custom_not_achieved` - Custom not achieved settings

Data is stored in `server/data.db`.

## CORS

CORS is enabled for all origins to allow the frontend to connect from any domain.

