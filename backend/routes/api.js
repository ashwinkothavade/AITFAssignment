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

// Helper: Retry with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Check if it's a rate limit or overload error
      const isOverloaded = error.message?.includes('overloaded') || 
                          error.message?.includes('rate') ||
                          error.message?.includes('429');
      
      if (isOverloaded) {
        const delay = baseDelay * Math.pow(2, i) + Math.random() * 1000;
        console.log(`API overloaded, retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error; // Don't retry on other errors
      }
    }
  }
}

// Fallback: Simple regex-based city extraction
function extractCityWithRegex(message, previousCity = null) {
  console.log('Using regex fallback for city extraction');
  
  // Check for references to previous city
  if (previousCity) {
    const previousRefs = /\b(there|here|still|again|too|also)\b/i;
    if (previousRefs.test(message) && !message.toLowerCase().includes('instead')) {
      return previousCity;
    }
  }
  
  // Common patterns for city extraction
  const patterns = [
    /(?:weather\s+(?:in|for|at)|forecast\s+(?:for|in))\s+([A-Z][a-zA-Z\s-]+?)(?:\s*[?,.]|\s*$)/i,
    /(?:in|at|visiting|going\s+to|trip\s+to)\s+([A-Z][a-zA-Z\s-]+?)(?:\s+weather|\s+forecast|\s*[?,.]|\s*$)/i,
    /^([A-Z][a-zA-Z\s-]+?)(?:\s+weather|\s+forecast)/i,
    /(?:what\s+about|how\s+about)\s+([A-Z][a-zA-Z\s-]+?)(?:\s+instead)?/i,
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const city = match[1].trim();
      // Basic validation
      if (city.length > 2 && city.length < 50 && !city.match(/\d/)) {
        console.log(`Regex extracted city: ${city}`);
        return city;
      }
    }
  }
  
  return null;
}

// Enhanced city extraction with fallback
async function extractCityWithGemini(message, geminiKey, previousCity = null) {
  try {
    // Try with retry logic
    const result = await retryWithBackoff(async () => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`;
      
      const systemPrompt = `You are a city extraction assistant. Your ONLY job is to identify if the user's message contains a request for weather information about a specific city or location.

Rules:
1. If the message asks about weather for a specific city/location, respond with ONLY the city name.
2. If the user says "here" or "today" or "now" without mentioning a city, respond with "PREVIOUS_CITY" if a previous city context exists.
3. If the user explicitly asks to change the city (e.g., "what about in Tokyo instead?"), extract the new city.
4. If no city is mentioned or implied, respond with "NO_CITY".
5. Common patterns to look for:
   - "weather in [city]"
   - "[city] weather"
   - "what's it like in [city]"
   - "should I bring an umbrella to [city]"
   - "visiting [city]"
   - "trip to [city]"
   - "what about [city]?"
   - "change to [city]"
   - "how's the weather there?" (use previous city)
6. Return ONLY one of: city name, "PREVIOUS_CITY", or "NO_CITY".

Previous city context: ${previousCity || 'None'}

Examples:
User: "What's the weather in Paris?" → Paris
User: "Tokyo weather forecast" → Tokyo
User: "Should I wear a jacket today?" → PREVIOUS_CITY (if previous city exists) or NO_CITY
User: "Planning a trip to London next week" → London
User: "How's the weather?" → PREVIOUS_CITY (if previous city exists) or NO_CITY
User: "What about in Berlin instead?" → Berlin
User: "Is it still raining there?" → PREVIOUS_CITY`;

      const contents = [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "user", parts: [{ text: `Extract city from: "${message}"` }] }
      ];

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || `Gemini API error: ${response.status}`);
      }

      const extractedCity = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      console.log("Gemini extracted:", extractedCity);
      
      if (extractedCity === "PREVIOUS_CITY") {
        return previousCity;
      }
      
      if (extractedCity && extractedCity !== "NO_CITY" && extractedCity.length > 1) {
        return extractedCity;
      }
      
      return null;
    }, 2, 2000); // 2 retries with 2 second base delay
    
    return result;
    
  } catch (error) {
    console.error("Gemini extraction failed, using regex fallback:", error.message);
    // Fallback to regex extraction
    return extractCityWithRegex(message, previousCity);
  }
}

// Helper: Generate AI response using Gemini
async function generateAI({ message, geminiKey, lang = "en-US", theme = "travel", weather = null, city = null, sessionHistory = [] }) {
  try {
    // Try with retry logic for Gemini
    const response = await retryWithBackoff(async () => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`;
      
      // Theme-specific system prompts
      const themePrompts = {
        travel: "You are a professional travel advisor who provides personalized travel recommendations based on weather conditions. Focus on destinations, activities, packing tips, and best times to visit.Limit response to 200 words",
        fashion: "You are a fashion consultant who suggests weather-appropriate outfits. Consider temperature, humidity, and weather conditions to recommend comfortable and stylish clothing options.Limit response to 200 words",
        sports: "You are a sports and fitness coach who recommends outdoor activities based on weather. Focus on safety, optimal conditions, and alternative indoor options when needed.Limit response to 200 words",
        agriculture: "You are an agricultural expert providing farming and gardening advice based on weather patterns. Consider planting schedules, crop care, and weather-related risks.Limit response to 200 words",
        events: "You are an event planner specializing in weather-conscious planning. Provide contingency plans, timing recommendations, and weather-appropriate suggestions.Limit response to 200 words",
        health: "You are a health and wellness advisor who provides weather-based health tips. Consider air quality, UV exposure, temperature extremes, and their health impacts.Limit response to 200 words"
      };

      let systemPrompt = themePrompts[theme] || themePrompts.travel;
      
      // Add weather context if provided - More detailed weather integration
      if (weather && city) {
        const weatherInfo = `\n\nCurrent weather conditions in ${city}:
- Description: ${weather.description}
- Temperature: ${weather.temperature}°C (feels like ${weather.feelsLike}°C)
- Humidity: ${weather.humidity}%
- Wind Speed: ${weather.windSpeed} km/h
- Wind Direction: ${weather.windDirection || 'N/A'}
- Pressure: ${weather.pressure || 'N/A'} hPa
- Visibility: ${weather.visibility ? `${(weather.visibility / 1000).toFixed(1)} km` : 'N/A'}
- Cloud Coverage: ${weather.clouds || 'N/A'}%
- UV Index: ${weather.uvIndex || 'N/A'}
- Sunrise: ${weather.sunrise || 'N/A'}
- Sunset: ${weather.sunset || 'N/A'}

IMPORTANT: Incorporate this real-time weather data naturally into your response. Provide specific, actionable advice based on these current conditions. The user is asking about ${city}, so make your response relevant to these exact weather conditions.`;
        
        systemPrompt += weatherInfo;
      }
      
      // Add language instruction
      const langInstructions = {
        "ja": "\n\nPlease respond in Japanese (日本語で返信してください).",
      };

      const langCode = lang.split('-')[0];
      if (langInstructions[langCode]) {
        systemPrompt += langInstructions[langCode];
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

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || `Gemini API error: ${res.status}`);
      }

      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response.';
      return textResponse.replace(/\*\*/g, '').replace(/##/g, '').trim();
    }, 3, 1000); // 3 retries with 1 second base delay
    
    return response;
    
  } catch (error) {
    console.error('Error in generateAI after retries:', error);
    
    // Fallback response when Gemini is completely unavailable
    if (error.message?.includes('overloaded')) {
      let fallbackResponse = "I apologize, but I'm experiencing high demand at the moment. ";
      
      if (weather && city) {
        // Provide basic weather-based response without AI
        fallbackResponse += `\n\nBased on the current weather in ${city}: `;
        fallbackResponse += `${weather.temperature}°C with ${weather.description}. `;
        
        if (weather.temperature < 10) {
          fallbackResponse += "It's quite cold, so dress warmly. ";
        } else if (weather.temperature > 25) {
          fallbackResponse += "It's warm, so light clothing would be comfortable. ";
        }
        
        if (weather.description.includes('rain')) {
          fallbackResponse += "Don't forget an umbrella! ";
        }
      } else {
        fallbackResponse += "Please try again in a moment.";
      }
      
      return fallbackResponse;
    }
    
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
      { id: 'fashion', name: 'Fashion Advisor', icon: '👗' },
      { id: 'sports', name: 'Sports Coach', icon: '🏃' },
      { id: 'agriculture', name: 'Agriculture Expert', icon: '🌾' },
      { id: 'events', name: 'Event Planner', icon: '🎉' },
      { id: 'health', name: 'Health Advisor', icon: '💊' }
    ]
  });
});

// POST /api/generate - Enhanced with Gemini city extraction
router.post("/generate", async (req, res) => {
  try {
    const { message, lang = "en-US", theme = "travel" } = req.body;
    let sessionId = req.body.sessionId;
    let sessionName = req.body.sessionName;
    let providedCity = req.body.city; // City from input field
    
    console.log('Generate request:', { message, lang, providedCity, sessionId, theme });
    
    // Generate session ID if not provided
    if (!sessionId) {
      sessionId = Date.now().toString();
      sessionName = sessionName || `New Chat - ${new Date().toLocaleDateString()}`;
    }

    const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_KEY) {
      throw new Error("Gemini API key not configured");
    }

    // FALLBACK 1: Get last known city from session if no city provided
    let sessionLastCity = null;
    if (!providedCity && sessionId) {
      const lastMessage = await Chat.findOne({ 
        sessionId, 
        city: { $exists: true, $ne: null } 
      })
      .sort({ createdAt: -1 })
      .select('city')
      .lean();
      
      sessionLastCity = lastMessage?.city;
      console.log('Last city from session:', sessionLastCity);
    }

    // STEP 1: Use Gemini to extract city from message
    let extractedCity = null;
    let isWeatherQuery = false;
    
    try {
      // Check if this is even a weather-related query
      const weatherKeywords = ['weather', 'temperature', 'rain', 'sunny', 'cloudy', 'forecast', 
                              'wear', 'pack', 'umbrella', 'jacket', 'hot', 'cold', 'humid'];
      isWeatherQuery = weatherKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
      );
      
      if (isWeatherQuery || providedCity || sessionLastCity) {
        extractedCity = await extractCityWithGemini(message, GEMINI_KEY, sessionLastCity);
        console.log('Gemini extracted city:', extractedCity);
      }
    } catch (err) {
      console.error("City extraction failed, continuing without:", err);
    }

    // FALLBACK 2: Smart city selection hierarchy
    // Priority: 1. Extracted from message, 2. Manually provided, 3. Last from session
    let cityToUse = extractedCity || providedCity || sessionLastCity;
    
    // FALLBACK 3: Handle "change city" intent
    if (extractedCity && sessionLastCity && extractedCity !== sessionLastCity) {
      console.log(`City changed from ${sessionLastCity} to ${extractedCity}`);
      // Clear the weather cache for the old city if needed
    }
    
    console.log('Final city to use:', cityToUse);

    // STEP 2: Fetch weather if we have a city
    let weatherData = null;
    let weatherError = null;
    
    if (cityToUse && OPENWEATHER_KEY) {
      try {
        console.log('Fetching weather for city:', cityToUse);
        const weather = await fetchWeather({ 
          city: cityToUse, 
          key: OPENWEATHER_KEY 
        });
        
        // Process weather data with more details
        weatherData = {
          description: weather.weather[0].description,
          temperature: Math.round(weather.main.temp),
          feelsLike: Math.round(weather.main.feels_like),
          humidity: weather.main.humidity,
          windSpeed: Math.round(weather.wind.speed * 3.6), // Convert m/s to km/h
          windDirection: getWindDirection(weather.wind.deg),
          pressure: weather.main.pressure,
          visibility: weather.visibility,
          clouds: weather.clouds?.all,
          uvIndex: weather.uvi,
          sunrise: weather.sys?.sunrise ? new Date(weather.sys.sunrise * 1000).toLocaleTimeString() : null,
          sunset: weather.sys?.sunset ? new Date(weather.sys.sunset * 1000).toLocaleTimeString() : null
        };
        
        console.log('Weather data processed:', weatherData);
      } catch (err) {
        console.error("Weather fetch error:", err);
        weatherError = err.message;
        // FALLBACK 4: Continue without weather data but note the error
      }
    }

    // STEP 3: Get session history for context
    const sessionHistory = await Chat.find({ sessionId })
      .sort({ createdAt: 1 })
      .limit(10)
      .lean();

    // STEP 4: Save user message (with weather data if available)
    const userMessage = await Chat.create({
      sessionId,
      sessionName,
      role: "user",
      text: message,
      lang,
      theme,
      city: cityToUse,
      weather: weatherData
    });

    // STEP 5: Generate AI response with weather context or fallback message
    let aiResponse;
    
    if (isWeatherQuery && !cityToUse) {
      // FALLBACK 5: No city detected for weather query
      aiResponse = "I'd be happy to help you with weather information! Could you please specify which city you'd like to know about? You can either type the city name in the message or use the city input field below.";
    } else if (weatherError && cityToUse) {
      // FALLBACK 6: Weather API failed but we have a city
      console.log("Generating response without weather data due to API error");
      aiResponse = await generateAI({ 
        message: message + ` (Note: Current weather data for ${cityToUse} is temporarily unavailable)`,
        geminiKey: GEMINI_KEY,
        lang,
        theme,
        weather: null,
        city: cityToUse,
        sessionHistory
      });
    } else {
      // Normal flow with or without weather
      aiResponse = await generateAI({ 
        message,
        geminiKey: GEMINI_KEY,
        lang,
        theme,
        weather: weatherData,
        city: cityToUse,
        sessionHistory
      });
    }

    // STEP 6: Save AI response
    await Chat.create({
      sessionId,
      sessionName,
      role: "ai",
      text: aiResponse,
      lang,
      theme,
      city: cityToUse,
      weather: null // Don't duplicate weather in AI response
    });

    // STEP 7: Send response to frontend
    res.json({
      ok: true,
      output: aiResponse,
      city: extractedCity || (weatherData ? cityToUse : null),
      weather: weatherData,
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

// Helper function to convert wind degrees to direction
function getWindDirection(degrees) {
  if (degrees == null) return null;
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

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