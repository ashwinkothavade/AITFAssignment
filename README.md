# AI Weather Chatbot with Japanese Voice Support

A sophisticated full-stack web application featuring an intelligent conversational AI assistant powered by Google's Gemini 2.0 Flash. The chatbot seamlessly integrates real-time weather data to provide contextually aware responses, supports Japanese voice input, and maintains comprehensive conversation memory across sessions.

## 🌟 Key Features

### 🤖 **Advanced AI Conversation**
- **Gemini 2.0 Flash Integration**: State-of-the-art language model for natural, intelligent responses
- **Conversation Memory**: Maintains context across the entire chat session (last 20 messages)
- **Smart Context Awareness**: References previous conversations naturally ("that weather", "the city we discussed")
- **Multi-language Support**: Seamless English and Japanese language processing

### 🌤️ **Weather Intelligence**
- **Real-time Weather Data**: Live weather information via OpenWeatherMap API
- **Automatic City Detection**: Intelligently extracts city names from natural language
- **Weather-Context Integration**: AI responses consider current weather conditions for relevant suggestions
- **Comprehensive Weather Metrics**: Temperature, humidity, wind speed/direction, visibility

### 🎙️ **Voice & Accessibility**
- **Japanese Voice Input**: Native Japanese speech recognition (mandatory feature)
- **Voice Controls**: Toggle microphone, continuous voice interaction
- **Modern UI/UX**: Clean, responsive design with dark/light mode support
- **Mobile-Optimized**: Fully responsive across all devices

### 💾 **Session Management**
- **Persistent Chat History**: MongoDB-powered session storage
- **AI-Generated Titles**: Smart 4-6 word session names based on conversation content
- **Session Organization**: View, rename, and manage multiple conversations
- **Search Functionality**: Full-text search across all conversations
- **Conversation Summaries**: AI-generated summaries for long chat sessions

## 🏗️ Architecture Overview

### Frontend Stack
- **React 18** with functional components and hooks
- **Tailwind CSS** for modern, responsive styling
- **Context API** for theme management
- **Web Speech API** for Japanese voice recognition

### Backend Stack  
- **Node.js + Express** RESTful API server
- **MongoDB + Mongoose** for data persistence
- **Session-based Architecture** with transaction support
- **External API Integration** (Gemini AI, OpenWeatherMap)

### Project Structure
```
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx      # Main chat interface
│   │   │   ├── ChatSidebar.jsx     # Session management
│   │   │   ├── MessageInput.jsx    # Input with voice support
│   │   │   ├── VoiceInputButton.jsx # Japanese voice input
│   │   │   └── LanguageSelector.jsx # Language switching
│   │   ├── contexts/
│   │   │   └── ThemeContext.js     # Dark/Light mode
│   │   └── App.js                  # Main application
├── backend/
│   ├── routes/
│   │   └── api.js                  # All API endpoints
│   ├── models/
│   │   └── Chat.js                 # MongoDB schema
│   └── server.js                   # Express server setup
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16.0 or higher
- **MongoDB** (Atlas recommended or local installation)
- **API Keys**:
  - [Google Gemini API Key](https://makersuite.google.com/app/apikey)
  - [OpenWeatherMap API Key](https://openweathermap.org/api)

### Environment Configuration

Create `backend/.env`:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatbot

# API Keys
GEMINI_API_KEY=your_gemini_api_key_here
OPENWEATHER_KEY=your_openweather_api_key_here

# Optional: CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### Installation & Setup

1. **Clone and Install Dependencies**
   ```bash
   # Backend setup
   cd backend
   npm install
   
   # Frontend setup
   cd ../frontend
   npm install
   ```

2. **Start Development Servers**
   ```bash
   # Terminal 1: Backend (from /backend)
   npm run dev
   
   # Terminal 2: Frontend (from /frontend)
   npm start
   ```

3. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📚 API Documentation

### Base URL: `http://localhost:5000/api`

#### Core Endpoints

**🤖 Generate AI Response**
```http
POST /generate
Content-Type: application/json

{
  "message": "What's the weather like in Tokyo? Should I bring an umbrella?",
  "lang": "en-US",              // or "ja-JP" for Japanese
  "city": "Tokyo",              // optional - auto-extracted if omitted
  "sessionId": "1727248123",    // optional - creates new if omitted
  "sessionName": "Tokyo Weather Chat" // optional - auto-generated
}
```

**Response:**
```json
{
  "ok": true,
  "output": "Based on Tokyo's current weather (light rain, 22°C), yes, definitely bring an umbrella! The humidity is high at 78% and there's a light drizzle...",
  "city": "Tokyo",
  "weather": {
    "description": "light rain",
    "temperature": 22,
    "feelsLike": 24,
    "humidity": 78,
    "windSpeed": 12,
    "windDirection": "NE",
    "visibility": "8.0 km"
  },
  "sessionId": "1727248123456",
  "sessionName": "Tokyo Weather Umbrella Advice",
  "isNewSession": false
}
```

**🌤️ Weather Testing**
```http
GET /test-weather?city=Tokyo
```

**📝 Session Management**
```http
# Get all sessions
GET /sessions

# Get messages for specific session
GET /messages/{sessionId}

# Rename session
PUT /sessions/{sessionId}/rename
Content-Type: application/json
{ "name": "New Session Name" }

# Get conversation summary
GET /sessions/{sessionId}/summary
```

**🔍 Search Messages**
```http
POST /search
Content-Type: application/json

{
  "query": "umbrella weather",
  "sessionId": "all"  // or specific session ID
}
```

## 🎯 Use Cases & Examples

### Weather-Aware Conversations
```
User: "I'm visiting Kyoto tomorrow"
AI: "That sounds wonderful! Let me check Kyoto's weather..."

User: "What should I pack for that weather?"
AI: "Based on Kyoto's forecast (cloudy, 18°C), I'd recommend..."
```

### Conversation Continuity
```
User: "Tell me about Tokyo"
AI: "Tokyo is Japan's bustling capital..."

User: "What about the weather there?"
AI: "In Tokyo (the city we were just discussing), the current weather is..."

User: "Is it different from yesterday?"
AI: "Comparing to our previous discussion about Tokyo's weather..."
```

### Multi-language Support
```
User: "東京の天気はどうですか？" (How's the weather in Tokyo?)
AI: "東京の現在の天気は..." (Tokyo's current weather is...)
```

## ⚙️ Configuration Options

### Weather API Settings
- **Units**: Metric (Celsius, km/h, %)
- **Language**: Japanese weather descriptions supported
- **Update Frequency**: Real-time API calls per request
- **Fallback**: Graceful handling when weather data unavailable

### AI Response Customization
```javascript
// In backend/routes/api.js - generateAI function
const systemInstruction = lang.startsWith("ja") 
  ? "あなたは親切なアシスタントです。天気情報と会話履歴を活用してください。"
  : "You are a helpful assistant. Use weather data and conversation history for personalized responses.";
```

### Voice Input Configuration
```javascript
// Japanese speech recognition setup
const recognition = new webkitSpeechRecognition();
recognition.lang = 'ja-JP';
recognition.continuous = false;
recognition.interimResults = false;
```

## 🛠️ Development Guide

### Adding New Features

**1. New API Endpoint**
```javascript
// backend/routes/api.js
router.post("/new-feature", async (req, res) => {
  try {
    // Implementation here
    res.json({ ok: true, data: result });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});
```

**2. Frontend Component**
```jsx
// frontend/src/components/NewComponent.jsx
import React, { useState } from 'react';

const NewComponent = () => {
  const [state, setState] = useState('');
  
  return (
    <div className="p-4">
      {/* Component JSX */}
    </div>
  );
};

export default NewComponent;
```

### Testing Weather Integration
```bash
# Test weather endpoint directly
curl "http://localhost:5000/api/test-weather?city=Tokyo"

# Expected response format
{
  "ok": true,
  "city": "Tokyo",
  "weather": {
    "description": "clear sky",
    "temperature": 25,
    "feelsLike": 27,
    "humidity": 60,
    "windSpeed": 10,
    "windDirection": "SW",
    "visibility": "10.0 km"
  }
}
```

## 🔧 Troubleshooting

### Common Issues

**API Connection Problems**
```bash
# Check API keys are loaded
node -e "console.log(process.env.GEMINI_API_KEY ? 'Gemini: OK' : 'Gemini: Missing')"
node -e "console.log(process.env.OPENWEATHER_KEY ? 'Weather: OK' : 'Weather: Missing')"
```

**MongoDB Connection Issues**
```javascript
// Check connection in backend/server.js
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});
```

**Voice Input Not Working**
- Ensure HTTPS or localhost (required for Web Speech API)
- Check browser microphone permissions
- Verify Japanese language pack is installed

**Conversation Memory Issues**
- Check `sessionId` is being passed correctly
- Verify messages are saved with proper `role` field
- Monitor MongoDB for stored conversation history

## 🚀 Advanced Features

### Extending Weather Intelligence
```javascript
// Add weather-based suggestions
if (weatherData.temperature > 30) {
  suggestions.push("Stay hydrated in this heat!");
} else if (weatherData.description.includes("rain")) {
  suggestions.push("Don't forget an umbrella!");
}
```

### Custom Voice Commands
```javascript
// Voice command recognition patterns
const commands = {
  'weather': () => getCurrentWeather(),
  'new chat': () => startNewSession(),
  'search': (query) => searchConversations(query)
};
```

### Session Analytics
```javascript
// Track conversation metrics
router.get('/analytics/:sessionId', async (req, res) => {
  const stats = await Chat.aggregate([
    { $match: { sessionId: req.params.sessionId } },
    { $group: { 
      _id: null, 
      messageCount: { $sum: 1 },
      avgLength: { $avg: { $strLenCP: "$text" } }
    }}
  ]);
  res.json({ ok: true, stats });
});
```

## 📊 Performance Considerations

- **Conversation History Limit**: 20 messages to optimize API response time
- **Weather API Caching**: Consider implementing Redis for frequent city requests
- **Database Indexing**: Add indexes on `sessionId` and `timestamp` fields
- **Rate Limiting**: Implement API rate limiting for production deployment

## 🌐 Deployment

### Production Environment Variables
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://prod-user:secure-password@cluster.mongodb.net/chatbot-prod
GEMINI_API_KEY=prod_gemini_key
OPENWEATHER_KEY=prod_weather_key
CORS_ORIGIN=https://your-domain.com
```

### Docker Deployment
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Development Standards
- Follow ESLint configuration
- Write descriptive commit messages
- Add comments for complex logic
- Update README for new features


## 🙏 Acknowledgments

- **Google Gemini** for advanced AI capabilities
- **OpenWeatherMap** for comprehensive weather data
- **MongoDB** for reliable data persistence
- **React & Tailwind CSS** for modern UI framework

---

**Built with ❤️ for intelligent, weather-aware conversations**

*Last updated: September 2025*