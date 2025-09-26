# AITFAssignment – AI Chat with Weather, Voice, and Persistent Sessions

An end-to-end AI chat application featuring:
- Intelligent AI responses (Gemini 2.0 Flash)
- Conversation memory with persistent chat sessions (MongoDB)
- Smart city extraction + real-time weather integration (OpenWeatherMap)
- Japanese voice input and speech synthesis
- Search across conversations and session management
- Dark/light theme support

Monorepo: React frontend + Node/Express backend.

---

## ✨ Key Features

### 🤖 AI Conversation
- Gemini 2.0 Flash integration for fast, natural responses  
- Conversation memory (last 20 messages used as context)  
- Multi-language support (English/Japanese)  

### 🌦️ Weather Intelligence
- Automatic city extraction from natural language  
- Real-time weather (OpenWeatherMap) blended into AI context  
- Metrics: description, temperature, feels like, humidity, wind, visibility  

### 🎙️ Voice & Accessibility
- Japanese speech recognition (Web Speech API)  
- Speech synthesis of AI responses with toggle  
- Modern, responsive UI with dark/light themes  

### 📂 Session Management
- Persistent chat history in MongoDB  
- AI-generated session titles (4–6 words)  
- Rename, delete, and switch sessions  
- Full-text search across messages  

---

## 🛠 Tech Stack

- **Frontend:** React 18, Tailwind CSS, Web Speech API (deployed on Vercel)  
- **Backend:** Node.js + Express, Mongoose (deployed on Render)  
- **External APIs:** Google Generative Language (Gemini 2.0 Flash), OpenWeatherMap  
- **Database:** MongoDB Atlas  

---

## 🖥️ Backend Overview

- **Entry:** `backend/index.js`  
  - Configures CORS (`*.vercel.app`, `http://localhost:3000`)  
  - Starts server only after MongoDB connects (`app.listen(PORT, '0.0.0.0', ...)`)  

- **Routes:** `backend/routes/api.js`  
  - `POST /api/generate` — Generate AI response (conversation + optional weather)  
  - `GET /api/messages/:sessionId` — Fetch messages for a session  
  - `GET /api/sessions` — List sessions (name, lastMessageAt, messageCount)  
  - `PUT /api/sessions/:sessionId/rename` — Rename a session  
  - `DELETE /api/sessions/:sessionId` — Delete a session (all messages)  
  - `POST /api/search` — Full-text search across messages (per session)  
  - `GET /api/test-weather?city=Tokyo` — Weather test endpoint  
  - `GET /api/sessions/:sessionId/summary` — AI-generated session summary  
  - `GET /api/` — Health check  

- **Model:** `backend/models/Chat.js`  
  - Message schema: `sessionId`, `role`, `text`, `lang`, `city`, `weather`, timestamps  
  - Ensure text index for search:  
    ```js
    db.chats.createIndex({ text: "text" })
    ```

---

## 🎨 Frontend Overview

- **Entry:** `frontend/src/App.js`  
  - Theme context (dark/light), chat UI (header, messages, input)  
  - Uses centralized API client for network calls  

- **Sidebar:** `frontend/src/components/ChatSidebar.jsx`  
  - Session list, search, rename, delete  
  - API: `getSessions`, `searchMessages`, `renameSession`, `deleteSession`  

- **API Client:** `frontend/src/api/index.js`  
  - `BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'`  
  - Exposes:
    - `getMessages(sessionId)`  
    - `getSessions()`  
    - `renameSession(sessionId, name)`  
    - `deleteSession(sessionId)`  
    - `searchMessages(query, sessionId = 'all')`  
    - `generate({ message, lang, city, sessionId, sessionName })`  
    - `testWeather(city)`  
    - `getSessionSummary(sessionId)`  

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
GEMINI_API_KEY=<your_gemini_key>
OPENWEATHER_KEY=<your_openweather_key>
```

### Frontend (`frontend/.env` or Vercel Project Settings)
```env
REACT_APP_API_BASE_URL=https://<your-backend-domain>/api
````

---

## 💻 Local Development

### Backend

```bash
cd backend
npm install
npm start
# Runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

> ✅ CORS is pre-configured for `*.vercel.app` and `http://localhost:3000`.

---

## 🐳 Docker Setup (Optional)

### Build & Run

```bash
docker compose build
docker compose up -d
```

* Frontend → [http://localhost:3000](http://localhost:3000)
* Backend → [http://localhost:5000](http://localhost:5000)

**Files:**

* `backend/Dockerfile`
* `frontend/Dockerfile`
* `frontend/nginx.conf`
* `docker-compose.yml`

---

## 🚀 Deployment

### Backend (Render)

* **Root Directory:** `backend`
* **Build Command:** `npm install`
* **Start Command:** `npm start`
* **Env Vars:** `PORT`, `MONGODB_URI`, `GEMINI_API_KEY`, `OPENWEATHER_KEY`
* **Health Check:** `GET /api/`
* Must bind to `0.0.0.0` and start **only after Mongo connects**

### Frontend (Vercel)

* **Root Directory:** `frontend`
* **Build Command:** `npm run build`
* **Output Directory:** `build`

#### Option A — Env Var

Set in Vercel project settings:

```env
REACT_APP_API_BASE_URL=https://<your-render-app>/api
```

#### Option B — Rewrites (no CORS/env var needed)

Create `frontend/vercel.json`:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://<your-render-app>/api/$1" }
  ]
}
```

And set `BASE_URL = '/api'` in `frontend/src/api/index.js`.

---

## 📖 API Reference

### `POST /api/generate`

**Body:**

```json
{ "message": "Hello", "lang": "en", "city": "Tokyo", "sessionId": "<id>", "sessionName": "Chat 1" }
```

**Response:**

```json
{ "ok": true, "output": "...", "city": "Tokyo", "weather": {...}, "sessionId": "<id>", "sessionName": "Chat 1", "isNewSession": false }
```

### `GET /api/messages/:sessionId`

**Response:**

```json
{ "ok": true, "messages": [...], "sessionName": "Chat 1" }
```

### `GET /api/sessions`

**Response:**

```json
{ "ok": true, "sessions": [{ "_id": "<id>", "sessionName": "Chat 1", "lastMessageAt": "2025-09-26T12:00:00Z", "messageCount": 15 }] }
```

### `PUT /api/sessions/:sessionId/rename`

**Body:**

```json
{ "name": "New Chat Name" }
```

**Response:**

```json
{ "ok": true, "sessionName": "New Chat Name", "sessionId": "<id>" }
```

### `DELETE /api/sessions/:sessionId`

**Response:**

```json
{ "ok": true, "deleted": true, "sessionId": "<id>" }
```

### `POST /api/search`

**Body:**

```json
{ "query": "weather", "sessionId": "all" }
```

**Response:**

```json
{ "ok": true, "results": [{ "_id": "<id>", "sessionName": "Chat 1", "matches": [{ "text": "What's the weather?", "role": "user", "createdAt": "..." }] }] }
```

### `GET /api/test-weather?city=Tokyo`

**Response:**

```json
{ "ok": true, "city": "Tokyo", "weather": { "temp": 26, "description": "clear sky" } }
```

### `GET /api/sessions/:sessionId/summary`

**Response:**

```json
{ "ok": true, "summary": "User asked about Tokyo weather and received AI responses." }
```



