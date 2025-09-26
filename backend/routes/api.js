import express from "express";
import Chat from "../models/Chat.js";
import mongoose from 'mongoose';

const router = express.Router();

// In-memory weather cache
const weatherCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Helper: Check if weather cache is valid
function getWeatherFromCache(city) {
  const cached = weatherCache.get(city?.toLowerCase());
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

// Helper: Store weather in cache
function cacheWeather(city, data) {
  if (city) {
    weatherCache.set(city.toLowerCase(), {
      data,
      timestamp: Date.now()
    });
  }
}

// Helper: Fetch weather from OpenWeatherMap
async function fetchWeather({ city, key }) {
  // Check cache first
  const cached = getWeatherFromCache(city);
  if (cached) {
    console.log(`Using cached weather for ${city}`);
    return cached;
  }

  try {
    console.log(`Fetching new weather data for ${city}`);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${key}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather API error");
    const data = await res.json();
    
    // Cache the result
    cacheWeather(city, data);
    
    return data;
  } catch (error) {
    console.error("Weather fetch error:", error);
    throw error;
  }
}

// Helper: Extract city from message
function extractCityFromMessage(message) {
  const patterns = [
    /(?:weather in|weather for|in|at|forecast for)\s+([A-Z][a-zA-Z\s-]+?)(?:\s*\?|\s*$|\s*,)/i,
    /^([A-Z][a-zA-Z\s-]+?)(?:\s+weather|\s*\?|\s*$)/i,
    /(?:what's|what is|how's|how is)\s+(?:the\s+)?(?:weather|temperature|forecast)\s+(?:in|at|for)\s+([A-Z][a-zA-Z\s-]+?)(?:\s*\?|\s*$|\s*,)/i,
    /(?:in|visit|travel to|going to|trip to)\s+([A-Z][a-zA-Z\s-]+?)(?:\s*\?|\s*$|\s*,|\s+today|\s+tomorrow)/i
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const city = match[1].trim();
      // Validate it's likely a city name
      if (city.length > 2 && city.length < 50 && !city.match(/\d/)) {
        return city;
      }
    }
  }
  return null;
}

// Helper: Generate AI response using Gemini
async function generateAI({ message, geminiKey, lang = "en-US", theme = "travel", weather = null, city = null, sessionHistory = [] }) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`;
    
    // Theme-specific system prompts
    const themePrompts = {
      travel: "You are a professional travel advisor who provides personalized travel recommendations based on weather conditions. Focus on destinations, activities, packing tips, and best times to visit.",
      fashion: "You are a fashion consultant who suggests weather-appropriate outfits. Consider temperature, humidity, and weather conditions to recommend comfortable and stylish clothing options.",
      sports: "You are a sports and fitness coach who recommends outdoor activities based on weather. Focus on safety, optimal conditions, and alternative indoor options when needed.",
      agriculture: "You are an agricultural expert providing farming and gardening advice based on weather patterns. Consider planting schedules, crop care, and weather-related risks.",
      events: "You are an event planner specializing in weather-conscious planning. Provide contingency plans, timing recommendations, and weather-appropriate suggestions.",
      health: "You are a health and wellness advisor who provides weather-based health tips. Consider air quality, UV exposure, temperature extremes, and their health impacts."
    };

    let systemPrompt = themePrompts[theme] || themePrompts.travel;
    
    // Add weather context if provided - THIS IS KEY!
    if (weather && city) {
      const weatherInfo = `\n\nCurrent weather conditions in ${city}:
- Description: ${weather.description}
- Temperature: ${weather.temperature}°C (feels like ${weather.feelsLike}°C)
- Humidity: ${weather.humidity}%
- Wind Speed: ${weather.windSpeed} km/h
- Pressure: ${weather.pressure || 'N/A'} hPa
- Visibility: ${weather.visibility ? `${(weather.visibility / 1000).toFixed(1)} km` : 'N/A'}
- Cloud Coverage: ${weather.clouds || 'N/A'}%

Please incorporate this weather information into your response when relevant to the user's question.`;
      
      systemPrompt += weatherInfo;
    }
    
    // Add language instruction
    if (lang.startsWith("ja")) {
      systemPrompt += "\n\nPlease respond in Japanese (日本語で返信してください).";
    } else if (lang.startsWith("es")) {
      systemPrompt += "\n\nPlease respond in Spanish.";
    } else if (lang.startsWith("fr")) {
      systemPrompt += "\n\nPlease respond in French.";
    } else if (lang.startsWith("de")) {
      systemPrompt += "\n\nPlease respond in German.";
    }

    // Build conversation context
    const contents = [];
    
    // Add session history for context (last 5 messages)
    if (sessionHistory.length > 0) {
      sessionHistory.slice(-5).forEach(msg => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }
    
    // Add system prompt and current message
    contents.push(
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "user", parts: [{ text: message }] }
    );

    const body = { contents };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(`Gemini API error: ${data.error?.message || 'Unknown'}`);

    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response.';
    return textResponse.replace(/\*\*/g, '').replace(/##/g, '').trim();
  } catch (error) {
    console.error('Error in generateAI:', error);
    throw error;
  }
}

// ===== API ENDPOINTS =====

// GET /api/themes
router.get("/themes", (req, res) => {
  res.json({ 
    ok: true, 
    themes: [
      { id: 'travel', name: 'Travel Assistant', icon: '✈️' },
      { id: 'fashion', name: 'Fashion Advisor', icon: '👔' },
      { id: 'sports', name: 'Sports Coach', icon: '🏃' },
      { id: 'agriculture', name: 'Agriculture Expert', icon: '🌾' },
      { id: 'events', name: 'Event Planner', icon: '🎉' },
      { id: 'health', name: 'Health Advisor', icon: '💊' }
    ]
  });
});

// POST /api/generate - Main generation endpoint with weather
router.post("/generate", async (req, res) => {
  try {
    // Use const for values that won't change, let for values that will
    const { message, lang = "en-US", theme = "travel" } = req.body;
    let sessionId = req.body.sessionId;
    let sessionName = req.body.sessionName;
    let city = req.body.city;
    
    console.log('Generate request:', { message, lang, city, sessionId, theme });
    
    // Generate session ID if not provided
    if (!sessionId) {
      sessionId = Date.now().toString();
      sessionName = sessionName || `New Chat - ${new Date().toLocaleDateString()}`;
    }

    // Check if message mentions a city
    const extractedCity = extractCityFromMessage(message);
    console.log('Extracted city from message:', extractedCity);
    
    // Use extracted city if found, otherwise use provided city
    const cityToUse = extractedCity || city;
    
    let weatherData = null;
    const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    // Fetch weather if we have a city
    if (cityToUse && OPENWEATHER_KEY) {
      try {
        console.log('Fetching weather for city:', cityToUse);
        const weather = await fetchWeather({ 
          city: cityToUse, 
          key: OPENWEATHER_KEY 
        });
        
        weatherData = {
          description: weather.weather[0].description,
          temperature: Math.round(weather.main.temp),
          feelsLike: Math.round(weather.main.feels_like),
          humidity: weather.main.humidity,
          windSpeed: Math.round(weather.wind.speed * 3.6),
          pressure: weather.main.pressure,
          visibility: weather.visibility,
          clouds: weather.clouds?.all
        };
        
        console.log('Weather data fetched:', weatherData);
      } catch (err) {
        console.error("Weather error:", err);
        // Continue without weather data
      }
    }

    // Get session history for context
    const sessionHistory = await Chat.find({ sessionId })
      .sort({ createdAt: 1 })
      .limit(10)
      .lean();

    // Save user message
    const userMessage = await Chat.create({
      sessionId,
      sessionName,
      role: "user",
      text: message,
      lang,
      theme,
      city: cityToUse,
      weather: weatherData // Save weather data with user message
    });

    // Generate AI response with weather context
    const aiResponse = await generateAI({ 
      message,
      geminiKey: GEMINI_KEY,
      lang,
      theme,
      weather: weatherData, // Pass weather to AI
      city: cityToUse,
      sessionHistory
    });

    // Save AI response
    await Chat.create({
      sessionId,
      sessionName,
      role: "ai",
      text: aiResponse,
      lang,
      theme,
      city: cityToUse,
      weather: null // Don't duplicate weather data in AI response
    });

    res.json({
      ok: true,
      output: aiResponse,
      city: extractedCity || (weatherData ? cityToUse : null), // Only return city if new or with weather
      weather: weatherData, // Return weather data for modal
      sessionId,
      sessionName,
      theme
    });

  } catch (error) {
    console.error("Error in /generate:", error);
    res.status(500).json({ 
      ok: false, 
      error: error.message || "Internal server error"
    });
  }
});

// GET /api/sessions
router.get("/sessions", async (req, res) => {
  try {
    const sessions = await Chat.aggregate([
      { $group: { 
        _id: "$sessionId",
        sessionName: { $first: "$sessionName" },
        lastMessageAt: { $max: "$createdAt" },
        messageCount: { $sum: 1 },
        theme: { $first: "$theme" }
      }},
      { $sort: { lastMessageAt: -1 } },
      { $limit: 50 }
    ]);
    res.json({ ok: true, sessions });
  } catch (err) {
    console.error("Error fetching sessions:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/messages/:sessionId
router.get("/messages/:sessionId", async (req, res) => {
  try {
    const messages = await Chat.find({ sessionId: req.params.sessionId })
      .sort({ createdAt: 1 })
      .lean();
    
    res.json({ 
      ok: true, 
      messages, 
      sessionName: messages[0]?.sessionName || "New Chat",
      theme: messages[0]?.theme || "travel"
    });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/sessions/:sessionId
router.delete("/sessions/:sessionId", async (req, res) => {
  try {
    const result = await Chat.deleteMany({ sessionId: req.params.sessionId });
    res.json({ ok: true, deleted: result.deletedCount });
  } catch (err) {
    console.error("Error deleting session:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /api/sessions/:sessionId/rename
router.put("/sessions/:sessionId/rename", async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ ok: false, error: "Name is required" });
    }
    
    await Chat.updateMany(
      { sessionId: req.params.sessionId },
      { $set: { sessionName: name.trim() } }
    );
    
    res.json({ ok: true, sessionName: name.trim() });
  } catch (err) {
    console.error("Error renaming session:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/test-weather
router.get("/test-weather", async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) {
      return res.status(400).json({ ok: false, error: "City parameter required" });
    }
    
    const weather = await fetchWeather({ 
      city, 
      key: process.env.OPENWEATHER_KEY 
    });
    
    res.json({ 
      ok: true, 
      weather,
      cached: !!getWeatherFromCache(city)
    });
  } catch (error) {
    console.error("Test weather error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/health
router.get("/health", (req, res) => {
  res.json({ 
    ok: true, 
    status: "healthy",
    timestamp: new Date().toISOString(),
    cacheSize: weatherCache.size
  });
});

export default router;