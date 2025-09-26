import express from "express";
import Chat from "../models/Chat.js";
import mongoose from 'mongoose'; // Import mongoose

const router = express.Router();

// --- Helper: Fetch weather from OpenWeatherMap ---
async function fetchWeather({ city, lat, lon, key }) {
  let url = "https://api.openweathermap.org/data/2.5/weather?";
  if (lat && lon) {
    url += `lat=${lat}&lon=${lon}`;
  } else if (city) {
    url += `q=${encodeURIComponent(city)}`;
  } else {
    throw new Error("City or coordinates required");
  }
  url += `&appid=${key}&units=metric&lang=ja`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather API error");
  return await res.json();
}

// --- Enhanced Helper: Generate AI response using Gemini with conversation history ---
async function generateAI({ messages, geminiKey, sessionId, lang = "en-US" }) {
  try {
    // If sessionId is provided, fetch conversation history
    let conversationHistory = [];
    if (sessionId) {
      const chatHistory = await Chat.find({ sessionId })
        .sort({ timestamp: 1 }) // Sort chronologically
        .limit(20) // Limit to last 20 messages to avoid token limits
        .lean();
      
      // Convert chat history to Gemini format, excluding the current message
      conversationHistory = chatHistory.map(chat => ({
        role: chat.role === 'user' ? 'user' : 'model',
        parts: [{ text: chat.text }]
      }));
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;

    // Prepare the request payload with conversation history
    let contents = [];
    
    // Add conversation history first
    if (conversationHistory.length > 0) {
      contents = [...conversationHistory];
    }
    
    // Add new messages
    const newMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
    
    contents = [...contents, ...newMessages];

    // Add system instruction for conversation continuity
    const systemInstruction = lang.startsWith("ja") 
      ? "あなたは親切なアシスタントです。過去の会話を覚えており、それを参考に返答してください。ユーザーが「それ」「あれ」「前に言った」などと言った場合は、会話履歴から適切な情報を参照してください。"
      : "You are a helpful assistant. Remember our previous conversation and reference it when relevant. If the user refers to 'that', 'it', 'what you said before', etc., use the conversation history for context.";

    // Insert system instruction at the beginning if we have conversation history
    if (conversationHistory.length > 0) {
      contents.unshift({
        role: 'user',
        parts: [{ text: systemInstruction }]
      });
    }

    const body = { contents };

    console.log('Sending request to Gemini API with conversation history:', JSON.stringify({
      historyLength: conversationHistory.length,
      totalMessages: contents.length
    }, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    console.log('Gemini API response status:', response.status);

    if (!response.ok) {
      throw new Error(`Gemini API error: ${data.error?.message || 'Unknown error'}`);
    }

    // Extract the response text
    let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text ||
                     data.candidates?.[0]?.content?.parts?.[0]?.text ||
                     data.text || '';

    if (!textResponse) {
      console.error('Unexpected Gemini API response format:', data);
      throw new Error('Could not parse AI response');
    }

    // Clean up the response
    textResponse = textResponse
      .replace(/\*\*|__/g, '')  // Remove markdown bold/underline
      .replace(/\*|_/g, '')      // Remove markdown italics
      .replace(/`{1,3}/g, '')    // Remove code blocks
      .replace(/^#+\s*/gm, '')   // Remove markdown headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Remove markdown links
      .replace(/<[^>]*>/g, '')    // Remove HTML tags
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
      .replace(/^\s*[\r\n]/gm, '') // Remove empty lines at start
      .replace(/[\r\n]\s*$/g, '') // Remove trailing newlines
      .replace(/([.!?])\s{2,}(?=[A-Z])/g, '$1 ') // Fix spacing after punctuation
      .trim();

    return textResponse;
  } catch (error) {
    console.error('Error in generateAI:', error);
    throw error; // Re-throw to be handled by the caller
  }
}

// Helper function to generate a session name from user message
async function generateSessionName(message, geminiKey) {
  try {
    const prompt = `Generate a concise, 4-6 word title based on this message. 
    Make it descriptive but brief. Focus on the main topic or question. 
    Just return the title, no quotes or formatting.\n\nMessage: "${message}"`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error('Failed to generate session name');
    
    const title = data.candidates?.[0]?.content?.parts?.[0]?.text || 'New Chat';
    // Clean up the response and ensure it's 4-6 words
    return title.trim()
      .replace(/[\"\']/g, '') // Remove quotes
      .split('\n')[0] // Take first line if multiple
      .split(' ')
      .slice(0, 6) // Max 6 words
      .join(' ');
  } catch (error) {
    console.error('Error generating session name:', error);
    return 'New Chat';
  }
}

// Enhanced city extraction with better pattern matching
function extractCityFromMessage(message) {
  if (!message) return null;
  
  // Common patterns for city mentions
  const patterns = [
    // Patterns like "in New York", "at Tokyo"
    /(?:in|at|from|for|about|near|around|close to|in the city of|in the town of)\s+([A-Z][a-zA-Z\s-]+[a-z])(?=\s*\?|\s*$|\s*!|\s*,|\s*\.|\s+in\s+the|\s+on\s+the)/i,
    // Patterns like "weather in Tokyo", "hotels in Paris"
    /(weather|forecast|hotel|restaurant|attraction|place|city|town|visit|see|explore|travel to|go to|going to|flying to|visiting|staying in|staying at|staying near|staying around|staying close to|staying in the city of|staying in the town of|what's|what is|what are|what're|what's the|what's in|what's there|what to do|what to see|what to visit|where to go|where to stay|where to eat|how is|how's|how are|how're|how is the|how's the|today|tomorrow|this week|next week|weekend)\s+(?:in|at|from|for|about|near|around|close to|in the city of|in the town of)?\s*([A-Z][a-zA-Z\s-]+[a-z])(?=\s*\?|\s*$|\s*!|\s*,|\s*\.|\s+in\s+the|\s+on\s+the)/i,
    // Direct city mentions at the start of the message
    /^([A-Z][a-zA-Z\s-]+[a-z])(?:\s*\?|\s*$|\s*!|\s*,|\s*\.|\s+in\s+the|\s+on\s+the)/i
  ];

  // Try each pattern until we find a match
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      // The city is usually in the last capturing group
      const cityMatch = match[match.length - 1].trim();
      if (cityMatch && cityMatch.length > 1) {
        // Clean up the city name (remove any trailing punctuation)
        return cityMatch.replace(/[^\w\s-]/g, '').trim();
      }
    }
  }
  return null;
}

// Helper function to convert wind degrees to direction
function getWindDirection(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// --- GET /api/test-weather ---
router.get("/test-weather", async (req, res) => {
  try {
    const { city } = req.query;
    
    if (!city) {
      return res.status(400).json({ 
        ok: false, 
        error: "City parameter is required" 
      });
    }

    const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY;
    
    if (!OPENWEATHER_KEY) {
      return res.status(500).json({ 
        ok: false, 
        error: "OpenWeatherMap API key is not configured" 
      });
    }

    const weather = await fetchWeather({
      city,
      key: OPENWEATHER_KEY,
    });

    res.json({ 
      ok: true, 
      city,
      weather: {
        description: weather.weather[0].description,
        temperature: Math.round(weather.main.temp),
        feelsLike: Math.round(weather.main.feels_like),
        humidity: weather.main.humidity,
        windSpeed: Math.round(weather.wind.speed * 3.6),
        windDirection: getWindDirection(weather.wind.deg),
        visibility: weather.visibility > 1000 
          ? `${(weather.visibility / 1000).toFixed(1)} km` 
          : `${weather.visibility} meters`
      }
    });
  } catch (error) {
    console.error("Test weather error:", error);
    res.status(500).json({ 
      ok: false, 
      error: error.message || "Failed to fetch weather data" 
    });
  }
});

// --- Enhanced POST /api/generate with conversation memory ---
router.post("/generate", async (req, res) => {
  let session;
  try {
    let { message, lang = "en-US", city, sessionId, sessionName } = req.body;
    let weatherData = null;
    let isNewSession = !sessionId;

    // Generate a new session ID if not provided
    if (!sessionId) {
      sessionId = Date.now().toString();
      // Generate a session name from the first message
      sessionName = await generateSessionName(message, process.env.GEMINI_API_KEY);
    }

    // Start a database session
    session = await mongoose.startSession();
    session.startTransaction();

    // Extract city from message if not provided
    if (!city) {
      city = extractCityFromMessage(message);
    }

    const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    // If we have a city, fetch weather data
    if (city && OPENWEATHER_KEY) {
      try {
        const weather = await fetchWeather({
          city,
          key: OPENWEATHER_KEY,
        });
        
        weatherData = {
          description: weather.weather[0].description,
          temperature: Math.round(weather.main.temp),
          feelsLike: Math.round(weather.main.feels_like),
          humidity: weather.main.humidity,
          windSpeed: Math.round(weather.wind.speed * 3.6),
          windDirection: getWindDirection(weather.wind.deg),
          visibility: weather.visibility > 1000 
            ? `${(weather.visibility / 1000).toFixed(1)} km` 
            : `${weather.visibility} meters`
        };
      } catch (weatherError) {
        console.error("Weather API error:", weatherError);
        // Continue without weather data
      }
    }

    // Save user message to database BEFORE generating AI response
    const userMessage = new Chat({
      sessionId,
      sessionName: sessionName || 'New Chat',
      role: "user",
      text: message,
      lang,
      city: city || null,
      weather: weatherData || null,
      timestamp: new Date()
    });

    await userMessage.save({ session });

    // Prepare messages for AI with enhanced context
    let systemMessage = lang.startsWith("ja")
      ? "あなたは親切で役立つアシスタントです。天気情報とユーザーとの会話履歴を活用して、適切で個人化された回答を提供してください。"
      : "You are a helpful assistant. Use weather information and conversation history to provide relevant, personalized responses.";

    let userPrompt = message;

    // Add weather context if available
    if (city && weatherData) {
      const weatherInfo = lang.startsWith("ja") 
        ? `\n\n現在の${city}の天気情報：\n` +
          `- 天気: ${weatherData.description}\n` +
          `- 気温: ${weatherData.temperature}°C (体感 ${weatherData.feelsLike}°C)\n` +
          `- 湿度: ${weatherData.humidity}%\n` +
          `- 風速: ${weatherData.windSpeed} km/h (${weatherData.windDirection})\n` +
          `- 視界: ${weatherData.visibility}`
        : `\n\nCurrent weather in ${city}:\n` +
          `- Weather: ${weatherData.description.charAt(0).toUpperCase() + weatherData.description.slice(1)}\n` +
          `- Temperature: ${weatherData.temperature}°C (Feels like ${weatherData.feelsLike}°C)\n` +
          `- Humidity: ${weatherData.humidity}%\n` +
          `- Wind: ${weatherData.windSpeed} km/h (${weatherData.windDirection})\n` +
          `- Visibility: ${weatherData.visibility}`;
      
      userPrompt += weatherInfo;
    }

    const messages = [
      { role: "model", content: systemMessage },
      { role: "user", content: userPrompt }
    ];

    // Generate AI response with conversation history
    const aiResponse = await generateAI({ 
      messages, 
      geminiKey: GEMINI_KEY,
      sessionId: sessionId, // Pass sessionId for conversation history
      lang 
    });

    // Save AI response to database
    const aiMessage = new Chat({
      sessionId,
      sessionName: sessionName || 'New Chat',
      role: "ai",
      text: aiResponse,
      lang,
      city: city || null,
      weather: weatherData || null,
      timestamp: new Date()
    });

    await aiMessage.save({ session });
    await session.commitTransaction();

    return res.json({ 
      ok: true, 
      output: aiResponse,
      city: city || null,
      weather: weatherData,
      sessionId,
      sessionName,
      isNewSession
    });

  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    console.error("Error in /generate:", error);
    res.status(500).json({ 
      ok: false, 
      error: "Internal server error",
      details: error.message 
    });
  } finally {
    if (session) {
      session.endSession();
    }
  }
});

// --- GET /api/sessions - Get all chat sessions
router.get("/sessions", async (req, res) => {
  try {
    const sessions = await Chat.aggregate([
      {
        $group: {
          _id: "$sessionId",
          sessionName: { $first: "$sessionName" },
          lastMessageAt: { $max: "$createdAt" },
          messageCount: { $sum: 1 },
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ]);
    res.json({ ok: true, sessions });
  } catch (err) {
    console.error("Error fetching sessions:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// --- GET /api/messages/:sessionId - Get messages for a specific session
router.get("/messages/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const messages = await Chat.find({ sessionId })
      .sort({ createdAt: 1 })
      .lean();
    
    if (messages.length > 0) {
      res.json({ ok: true, messages, sessionName: messages[0].sessionName });
    } else {
      res.json({ ok: true, messages: [], sessionName: "New Chat" });
    }
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// --- POST /api/search - Search messages
router.post("/search", async (req, res) => {
  try {
    const { query, sessionId } = req.body;
    
    const searchQuery = {
      $text: { $search: query },
    };
    
    if (sessionId && sessionId !== 'all') {
      searchQuery.sessionId = sessionId;
    }

    const results = await Chat.aggregate([
      { $match: searchQuery },
      { $sort: { score: { $meta: "textScore" } } },
      {
        $group: {
          _id: "$sessionId",
          sessionName: { $first: "$sessionName" },
          matches: {
            $push: {
              text: "$text",
              role: "$role",
              createdAt: "$createdAt",
            },
          },
        },
      },
    ]);

    res.json({ ok: true, results });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Rename a session
router.put("/sessions/:sessionId/rename", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { name: sessionName } = req.body;

    if (!sessionName || typeof sessionName !== 'string' || sessionName.trim().length === 0) {
      return res.status(400).json({ ok: false, error: "Session name is required" });
    }

    const trimmedName = sessionName.trim();
    
    // Only update the session name for the specified session
    const result = await Chat.updateMany(
      { sessionId },
      { $set: { sessionName: trimmedName } },
      { new: true }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, error: "Session not found" });
    }

    res.json({ 
      ok: true, 
      sessionName: trimmedName,
      sessionId
    });
  } catch (err) {
    console.error("Error renaming session:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// --- New endpoint: Get conversation summary for long chats ---
router.get("/sessions/:sessionId/summary", async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const chatHistory = await Chat.find({ sessionId })
      .sort({ timestamp: 1 })
      .lean();

    if (chatHistory.length === 0) {
      return res.json({ ok: true, summary: 'No conversation history found.' });
    }

    // Create summary of key topics discussed
    const conversationText = chatHistory
      .map(chat => `${chat.role}: ${chat.text}`)
      .join('\n');

    const summaryPrompt = `Summarize the key topics and important information from this conversation in 2-3 sentences:

${conversationText}`;

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: summaryPrompt }]
        }]
      })
    });

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate summary.';

    res.json({ ok: true, summary });

  } catch (error) {
    console.error('Error generating conversation summary:', error);
    res.status(500).json({ ok: false, error: 'Failed to generate summary' });
  }
});

// --- Health check ---
router.get("/", (req, res) => {
  res.send("API is running with conversation memory");
});

// router.delete('/sessions/:sessionId', async (req, res) => {
//   try {
//     const { sessionId } = req.params;
//     const result = await Chat.deleteMany({ sessionId });

//     if (!result || result.deletedCount === 0) {
//       return res.status(404).json({ ok: false, error: 'Session not found' });
//     }

//     return res.json({ ok: true, deleted: result.deletedCount, sessionId });
//   } catch (err) {
//     console.error('Error deleting session:', err);
//     return res.status(500).json({ ok: false, error: err.message });
//   }
// });
// --- GET /api/chats?sessionId=...&search=... ---
router.get("/chats", async (req, res) => {
  try {
    const { sessionId, search } = req.query;
    if (!sessionId)
      return res.status(400).json({ ok: false, error: "sessionId required" });

    const filter = { sessionId };
    if (search) filter.text = { $regex: search, $options: "i" };

    const chats = await Chat.find(filter).sort({ createdAt: 1 });
    res.json({ ok: true, chats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

export default router;