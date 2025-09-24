# AI Travel Assistant

A full-stack web application that provides an intelligent travel assistant powered by Gemini AI. The application offers conversational AI capabilities with weather integration, multi-language support, and session management.

## Features

- 💬 AI-powered chat interface using Gemini 2.0 Flash
- 🌦️ Real-time weather information for any location
- 🌍 Multi-language support (English, Japanese, and more)
- 🎙️ Voice input/output functionality
- 🌓 Dark/Light mode toggle
- 💾 Session history and management
- 🔍 Context-aware responses with location-based suggestions

## Tech Stack

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- Gemini AI API
- OpenWeatherMap API

### Frontend
- React.js
- Tailwind CSS
- Hero Icons
- React Icons

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas or local MongoDB instance
- Google Cloud API Key (for Gemini AI)
- OpenWeatherMap API Key

## Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Backend
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
OPENWEATHER_KEY=your_openweather_api_key
```

## Installation

1. Clone the repository:
   ```bash
   git clone [your-repository-url]
   cd AITFAssignment
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

## Running the Application

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. In a new terminal, start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

- `POST /api/generate` - Generate AI response
- `GET /api/messages/:sessionId` - Get chat history
- `GET /api/sessions` - Get all chat sessions
- `PUT /api/sessions/:sessionId/rename` - Rename a chat session
- `GET /api/test-weather?city=CityName` - Test weather API

## Project Structure

```
AITFAssignment/
├── backend/
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── .env              # Environment variables
│   └── index.js          # Server entry point
├── frontend/
│   ├── public/           # Static files
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── App.js        # Main App component
│   │   └── index.js      # Frontend entry point
│   └── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## Acknowledgments

- [Google Gemini AI](https://ai.google.dev/)
- [OpenWeatherMap](https://openweathermap.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
