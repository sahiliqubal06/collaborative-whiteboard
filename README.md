# Collaborative Whiteboard Application

Welcome to the Collaborative Whiteboard Application\! This is a real-time drawing tool built with the **MERN stack** (MongoDB, Express.js, React.js, Node.js) and powered by **Socket.io** for live collaboration.

-----

## 🚀 Setup Instructions

Follow these steps to get the application up and running on your local machine.

### Prerequisites

Before you start, ensure you have the following installed:

  * **Node.js**: Version 14 or higher (LTS recommended)
  * **npm**: Node Package Manager (comes with Node.js)
  * **MongoDB**: A running MongoDB instance (local or cloud-hosted)

### 1\. Clone the Repository

If your code is in a Git repository, start by cloning it:

```bash
git clone https://github.com/sahiliqubal06/collaborative-whiteboard.git
cd collaborative-whiteboard
```

### 2\. Backend Setup (Server)

Navigate to the `server` directory and install its dependencies.

```bash
cd server
npm install
```

**Environment Variables:**

Create a file named **`.env`** in the `server` directory and add the following:

```
# server/.env

PORT=5000
MONGO_URI=mongodb://localhost:27017/whiteboard_db
CLIENT_URL=http://localhost:3000
```

  * **`PORT`**: The port your Node.js server will listen on.
  * **`MONGO_URI`**: Your MongoDB connection string.
  * **`CLIENT_URL`**: The URL of your React frontend (important for CORS configuration).

**Start the Backend Server:**

```bash
npm start
```

You should see messages in your terminal confirming MongoDB connection and the server running on `http://localhost:5000`.

### 3\. Frontend Setup (Client)

Open a **new terminal window** and navigate to the `client` directory. Install its dependencies.

```bash
cd ../client # If you're currently in the server directory
npm install
```

**Environment Variables:**

Create a file named **`.env`** in the `client` directory and add the following:

```
# client/.env

REACT_APP_SOCKET_SERVER_URL=http://localhost:5000
```

  * **`REACT_APP_SOCKET_SERVER_URL`**: Create React App automatically exposes environment variables prefixed with `REACT_APP_` to your client-side code.

**Tailwind CSS Setup:**

Ensure Tailwind CSS is correctly configured. This involves:

1.  Having `tailwind.config.js` and `postcss.config.js` in `client/`.
2.  Ensuring `client/tailwind.config.js`'s `content` array includes `"./src/**/*.{js,jsx,ts,tsx}"`.
3.  Verifying `client/src/index.css` contains the Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`) along with the custom CSS for `.canvas-wrapper` and `.user-cursor`.

**Start the Frontend Development Server:**

```bash
npm start
```

Your browser should automatically open to `http://localhost:3000`. If not, navigate there manually.

### 4\. Test the Application

Open `http://localhost:3000` in multiple browser tabs or different browsers/devices. Join the same room (by entering the same 6-8 character code) or create a new one (by leaving the code blank).

  * **User Presence**: Observe the "Users:" count updating in real-time as tabs are opened/closed.
  * **Live Drawing Sync**: Draw in one tab and see it instantly appear in others. Test different colors, stroke widths, and the "Clear Canvas" feature.

-----

## 📝 API Documentation

This section details the communication protocols between the frontend and backend.

### REST Endpoints (Express.js)

These endpoints are used for initial room management and data retrieval.

  * **`POST /api/rooms/join`**

      * **Description**: Allows a user to join an existing whiteboard room or create a new one if the `roomId` doesn't exist or is not provided.
      * **Request Body**:
        ```json
        {
          "roomId": "OPTIONAL_6_8_CHAR_CODE" // e.g., "ABCD123" or "" to create new
        }
        ```
      * **Responses**:
          * `200 OK`: `{"roomId": "EXISTING_ROOM_CODE", "message": "Joined existing room."}`
          * `201 Created`: `{"roomId": "NEW_ROOM_CODE", "message": "Room created successfully."}`
          * `500 Internal Server Error`: `{"message": "Error creating room."}`

  * **`GET /api/rooms/:roomId`**

      * **Description**: Retrieves information about a specific room, including its unique ID and all stored drawing data.
      * **URL Parameters**: `:roomId` (e.g., `/api/rooms/ABCDEF`)
      * **Responses**:
          * `200 OK`: `{"roomId": "ROOM_CODE", "drawingData": [...]}` (Array of Drawing Command Schemas)
          * `404 Not Found`: `{"message": "Room not found."}`
          * `500 Internal Server Error`: `{"message": "Error fetching room data."}`

### Socket Events (Socket.io)

These events facilitate real-time, bidirectional communication for collaborative features.

#### Client to Server Events (Emitted by Frontend)

  * `'join-room'`: `(roomId: string, userId: string, userName: string)`
      * *Description*: Sent when a user enters a room.
  * `'leave-room'`: `(roomId: string)`
      * *Description*: Sent when a user disconnects or explicitly leaves.
  * `'cursor-move'`: `({ roomId: string, userId: string, x: number, y: number, userName: string, color: string })`
      * *Description*: Updates other users' cursor positions.
  * `'draw-start'`: `({ roomId: string, userId: string, drawingCommand: { points: Array<{x: number, y: number}>, color: string, width: number } })`
      * *Description*: Signals the beginning of a drawing stroke.
  * `'draw-move'`: `({ roomId: string, userId: string, drawingCommand: { points: Array<{x: number, y: number}>, color: string, width: number } })`
      * *Description*: Provides incremental drawing path data.
  * `'draw-end'`: `({ roomId: string, userId: string, drawingCommand: { points: Array<{x: number, y: number}>, color: string, width: number } })`
      * *Description*: Signals the completion of a drawing stroke.
  * `'clear-canvas'`: `(roomId: string)`
      * *Description*: Initiates clearing the canvas for all users in the room.

#### Server to Client Events (Emitted by Backend)

  * `'load-drawing-data'`: `(drawingData: Array<DrawingCommandSchema>)`
      * *Description*: Sends existing drawing history to a new user joining a room.
  * `'cursor-move'`: `({ userId: string, x: number, y: number, color: string, userName: string })`
      * *Description*: Broadcasts another user's cursor movement.
  * `'user-count-update'`: `(count: number)`
      * *Description*: Broadcasts the current number of active users in the room.
  * `'user-joined'`: `({ userId: string, userName: string })`
      * *Description*: Notifies existing users in a room that a new user has joined.
  * `'user-left'`: `(userId: string)`
      * *Description*: Notifies remaining users when another user leaves.
  * `'draw-start'`: `({ roomId: string, userId: string, drawingCommand: DrawingCommandObject })`
      * *Description*: Broadcasts the start of a drawing stroke from another user.
  * `'draw-move'`: `({ roomId: string, userId: string, drawingCommand: DrawingCommandObject })`
      * *Description*: Broadcasts incremental drawing updates from another user.
  * `'draw-end'`: `({ roomId: string, userId: string, drawingCommand: DrawingCommandObject })`
      * *Description*: Broadcasts the end of a drawing stroke from another user.
  * `'clear-canvas'`: `()`
      * *Description*: Broadcasts the command to clear the canvas to all users in the room.

### Database Schemas (MongoDB)

  * **Room Schema**: Represents a unique whiteboard session.
    ```javascript
    {
      roomId: String,          // Unique room code
      createdAt: Date,         // Timestamp of creation (TTL index set for 24h expiration)
      lastActivity: Date,      // Last activity timestamp
      drawingData: Array       // Array of Drawing Command Schemas
    }
    ```
  * **Drawing Command Schema**: Represents a single drawing action within a room.
    ```javascript
    {
      type: String,            // 'stroke' or 'clear'
      data: Object,            // Contains drawing details (points, color, width, userId)
      timestamp: Date
    }
    ```

-----

## 🏗️ Architecture Overview

The application utilizes a **MERN stack** (MongoDB, Express.js, React.js, Node.js) with a strong emphasis on **real-time communication** via **WebSockets**.

```
+----------------+          +-------------------+          +-------------------+
|    Frontend    |          |     Backend       |          |      Database     |
| (React.js)     |          | (Node.js/Express) |          |      (MongoDB)    |
+----------------+          +-------------------+          +-------------------+
| - User Interface |          | - REST API        |          | - Room Data       |
|   (RoomJoin,     |          |   (Room Mgmt)     |          |   - roomId        |
|   Whiteboard,    |          | - WebSocket Server|          |   - drawingData[] |
|   Toolbar, etc.) | <------> |   (Socket.io)     | <------> |                   |
| - Manages local  |          | - Manages room    |          |                   |
|   drawing state  |          |   sessions        |          |                   |
| - Sends/Receives |          | - Broadcasts real-|          |                   |
|   Socket events  |          |   time updates    |          |                   |
| - Renders canvas |          | - Persists drawing|          |                   |
|   & cursors      |          |   data to MongoDB |          |                   |
+----------------+          +-------------------+          +-------------------+
        ^                          ^
        | WebSocket Connection     | REST API Calls
        v                          v
    User's Browser (Multiple Clients)
```

**Key Interactions:**

1.  **Client Joins/Creates Room:** The React frontend makes a **REST API call** to the Express backend (`POST /api/rooms/join`) to either join an existing room or create a new one. The backend responds with the assigned `roomId`.
2.  **WebSocket Connection:** Upon successfully obtaining a room ID, the frontend establishes a **Socket.io WebSocket connection** with the backend. It then emits a `'join-room'` event, signaling its presence in the specific room.
3.  **Initial Drawing Load:** When a user joins, the server fetches any existing `drawingData` for that room from **MongoDB** and sends it to the new client via a `'load-drawing-data'` socket event, ensuring persistence.
4.  **Real-time Collaboration:**
      * **Drawing:** User drawing actions (start, move, end) are captured by the frontend and sent as incremental drawing data to the backend via Socket.io events (`'draw-start'`, `'draw-move'`, `'draw-end'`). The backend then immediately **broadcasts** this data to all other connected clients in the *same room*, which then render the updates on their local canvases.
      * **Cursor Tracking:** Similar to drawing, client cursor positions (`'cursor-move'`) are periodically sent to the backend and broadcast to other clients for real-time display, including their chosen drawing color.
      * **Presence:** The backend tracks the number of connected sockets per room and broadcasts `'user-count-update'` events to keep all clients informed of active users.
5.  **Data Persistence:** All drawing commands (`'stroke'` and `'clear'`) are stored in the `drawingData` array within the respective `Room` document in **MongoDB**. This ensures that drawings persist across sessions within the room's lifespan.
6.  **Automatic Cleanup:** MongoDB's TTL (Time-To-Live) index automatically deletes `Room` documents that haven't been active for 24 hours (based on `createdAt`), preventing database bloat.

-----


## ⚙️ Deployment Guide

This guide outlines deployment using **Vercel** or **Netlify** for the frontend, and **Render** for the backend, which is well-suited for persistent WebSocket connections.

-----

### 1\. Preparation

  * **Backend Environment Variables**:
      * Set `NODE_ENV=production` in your backend hosting environment.
      * Update `MONGO_URI` (your production MongoDB connection string), and `CLIENT_URL` (your production frontend URL) as environment variables in your backend hosting platform.
  * **Frontend Socket URL**:
      * In `client/src/components/Whiteboard.js`, the `SOCKET_SERVER_URL` should automatically pick up its value from `process.env.REACT_APP_SOCKET_SERVER_URL`.
      * You'll set `REACT_APP_SOCKET_SERVER_URL` (pointing to your production backend URL, e.g., `https://api.yourwhiteboardapp.com`) as an environment variable in your frontend hosting platform's build settings.
  * **CORS Configuration**:
      * In `server/server.js`, the `cors` `origin` for both Express and Socket.io uses `process.env.CLIENT_URL`. Ensure this environment variable is set to your **production frontend URL** (e.g., `https://yourwhiteboardapp.com`) in your backend hosting environment.

-----

### 2\. Frontend Deployment (Vercel or Netlify)

Vercel and Netlify are excellent choices for hosting your React frontend.

#### Steps for Vercel:

1.  **Sign Up/Log In**: Go to [vercel.com](https://vercel.com/) and sign up or log in.
2.  **Import Project**: Click "Add New..." -\> "Project". Choose "Import Git Repository" and select your project.
3.  **Configure Build**: Vercel usually auto-detects Create React App.
      * **Root Directory**: Set to `/client`.
      * **Build Command**: `npm run build`
      * **Output Directory**: `build`
4.  **Environment Variables**: In your Vercel project settings, go to "Environment Variables" and add `REACT_APP_SOCKET_SERVER_URL` with the value of your production backend URL.
5.  **Deploy**: Click "Deploy." Vercel will build and deploy your React app.

#### Steps for Netlify:

1.  **Sign Up/Log In**: Go to [netlify.com](https://www.netlify.com/) and sign up or log in.
2.  **Import from Git**: Click "Add new site" -\> "Import an existing project" -\> "Deploy with GitHub" (or other Git provider).
3.  **Select Repository**: Choose your project repository.
4.  **Configure Build**: Netlify usually auto-detects Create React App.
      * **Base directory**: `client/`
      * **Build command**: `npm run build`
      * **Publish directory**: `client/build`
5.  **Environment Variables**: In your Netlify site settings, go to "Build & deploy" -\> "Environment variables" and add `REACT_APP_SOCKET_SERVER_URL` with the value of your production backend URL.
6.  **Deploy**: Click "Deploy site."

-----

### 3\. Backend Deployment (Render)

Render is a robust platform well-suited for deploying Node.js applications with persistent WebSocket connections.

#### Steps for Render:

1.  **Sign Up/Log In**: Go to [render.com](https://render.com/) and sign up or log in.
2.  **Connect Git Repository**: Connect your GitHub/GitLab account to Render.
3.  **Create a New Web Service**:
      * Click "New" -\> "Web Service".
      * Select your project repository.
      * **Root Directory**: Set this to `/server` if your `server` folder is directly inside your repo.
      * **Runtime**: Select `Node`.
      * **Build Command**: `npm install`
      * **Start Command**: `npm start` (ensure your `server/package.json` has a `start` script defined, e.g., `"start": "node server.js"`).
4.  **Environment Variables**:
      * Go to the "Environment" section of your Render service settings.
      * Add your production environment variables:
          * `PORT` (Render typically provides this via `process.env.PORT`, but you can explicitly set it to `10000` for Render)
          * `MONGO_URI` (your production MongoDB connection string)
          * `CLIENT_URL` (your production frontend URL, e.g., `https://yourwhiteboardapp.com`)
          * (Optional, for horizontal scaling) `REDIS_URL` if you integrate the Socket.io Redis adapter.
5.  **Connect to Database**: Ensure your production MongoDB database (e.g., MongoDB Atlas) is accessible from Render's servers. Configure network access/IP whitelisting as needed.
6.  **Deploy**: Render will automatically build and deploy your Node.js backend. You'll get a public URL for your backend service.

-----

### 4\. Production WebSocket Considerations

  * **Sticky Sessions (Load Balancers)**: Render handles sticky sessions automatically for WebSockets on a single instance. If you scale to multiple backend instances, Render (like other providers) generally supports sticky sessions, which is crucial for Socket.io.
  * **Socket.io Redis Adapter (for true horizontal scaling)**: For horizontal scaling with multiple backend instances, it's highly recommended to integrate the `@socket.io/redis-adapter`. This allows all your backend Socket.io instances to communicate and pass messages between each other.
      * Install in `server` directory: `npm install @socket.io/redis-adapter redis`
      * Integrate in `server/server.js` (requires an external, persistent Redis database like Redis Cloud or Upstash):
        ```javascript
        // server/server.js
        import { createClient } from 'redis';
        import { createAdapter } from '@socket.io/redis-adapter';

        // ... existing imports ...

        // REDIS_URL should be an environment variable in Render's settings
        const pubClient = createClient({ url: process.env.REDIS_URL });
        const subClient = pubClient.duplicate();

        Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
            io.adapter(createAdapter(pubClient, subClient));
            console.log('Redis adapter connected to Socket.io');
        }).catch(err => console.error('Redis connection error:', err));

        // ... rest of your server.js
        ```
  * **Domain and SSL**: Always use an SSL certificate (`https://`) for both frontend and backend communication. Vercel, Netlify, and Render all provide this automatically for your deployed services.