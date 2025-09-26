import { useState, useEffect, createContext, useRef } from "react";
import ChatWindow from "./components/ChatWindow";
import ChatSidebar from "./components/ChatSidebar";
import MessageInput from "./components/MessageInput";
import Header from "./components/Header";
import WeatherModal from "./components/WeatherModal";
import api from "./api";
import "./App.css";

export const ThemeContext = createContext();

function App() {
  // Theme & UI State
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved
      ? saved === "true"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionName, setSessionName] = useState("New Chat");
  const [sessions, setSessions] = useState([]);

  // Settings State
  const [lang, setLang] = useState("en-US");
  const [theme, setTheme] = useState("travel");
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  // Weather State with Session Management
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [weatherModalOpen, setWeatherModalOpen] = useState(false);
  const [sessionWeatherData, setSessionWeatherData] = useState({});
  const weatherCacheRef = useRef({});
  const lastCityRef = useRef("");

  // Apply theme to document
  useEffect(() => {
    document.documentElement.className = darkMode ? "dark" : "light";
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await api.getSessions();
      if (data.ok) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  };

  const loadSession = async (sid) => {
    try {
      const data = await api.getMessages(sid);
      if (data.ok) {
        setMessages(data.messages);
        setSessionId(sid);
        setSessionName(data.sessionName);

        // Load weather data specific to this session
        const sessionWeather = sessionWeatherData[sid];
        if (sessionWeather) {
          setCity(sessionWeather.city);
          setWeather(sessionWeather.weather);
        } else {
          // Extract from last message with weather
          const lastWeatherMsg = [...data.messages]
            .reverse()
            .find((m) => m.city && m.weather);
          if (lastWeatherMsg) {
            setCity(lastWeatherMsg.city);
            setWeather(lastWeatherMsg.weather);
            setSessionWeatherData((prev) => ({
              ...prev,
              [sid]: {
                city: lastWeatherMsg.city,
                weather: lastWeatherMsg.weather,
              },
            }));
            lastCityRef.current = lastWeatherMsg.city;
            weatherCacheRef.current[lastWeatherMsg.city] =
              lastWeatherMsg.weather;
          }
        }
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setSessionName("New Chat");
    setWeather(null);
    setCity("");
    setWeatherModalOpen(false);
    lastCityRef.current = "";
  };

  const handleDeleteSession = async (sid) => {
    try {
      const response = await api.deleteSession(sid);
      if (response.ok) {
        if (sid === sessionId) {
          handleNewChat();
        }
        setSessionWeatherData((prev) => {
          const updated = { ...prev };
          delete updated[sid];
          return updated;
        });
        await loadSessions();
      } else {
        console.error("Failed to delete session:", response.error);
        alert("Failed to delete chat. Please try again.");
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
      alert("An error occurred while deleting the chat.");
    }
  };

  const handleSend = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      text: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const cityToSend =
        city && city !== lastCityRef.current ? city : undefined;

      const response = await api.generate({
        message: text,
        lang,
        city: cityToSend,
        sessionId,
        sessionName,
        theme,
      });

      if (response.ok) {
        const aiMessage = {
          role: "ai",
          text: response.output,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);

        // Update weather and store per session
        if (response.city && response.weather) {
          setCity(response.city);
          setWeather(response.weather);
          setSessionWeatherData((prev) => ({
            ...prev,
            [response.sessionId || sessionId]: {
              city: response.city,
              weather: response.weather,
            },
          }));
          lastCityRef.current = response.city;
          weatherCacheRef.current[response.city] = response.weather;
        } else if (response.city && weatherCacheRef.current[response.city]) {
          setCity(response.city);
          setWeather(weatherCacheRef.current[response.city]);
          lastCityRef.current = response.city;
        }

        if (response.sessionId) {
          setSessionId(response.sessionId);
          setSessionName(response.sessionName);
          await loadSessions();
        }

        if (isVoiceEnabled && window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(response.output);
          utterance.lang = lang;
          utterance.rate = 0.95;
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = {
        role: "ai",
        text: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Context value with all needed properties
  const contextValue = {
    darkMode,
    setDarkMode,
    lang,
    setLang,
    theme,
    setTheme,
    isVoiceEnabled,
    setIsVoiceEnabled,
    city,
    setCity,
    sessionId,
    sessionName,
    sessions,
    loadSessions,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <div className={`flex h-screen overflow-hidden ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        {/* Sidebar - Fixed width when open, hidden when closed */}
        <div className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 ease-in-out flex-shrink-0 lg:relative absolute z-40 h-full`}>
          <ChatSidebar
            currentSessionId={sessionId}
            onSelectSession={loadSession}
            onNewChat={handleNewChat}
            onDeleteSession={handleDeleteSession}
            className={`${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } transition-transform duration-300 ease-in-out w-80`}
          />
        </div>

        {/* Main Content Area - Flex to fill remaining space */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <Header
            sessionName={sessionName}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            isVoiceEnabled={isVoiceEnabled}
            onToggleVoice={() => setIsVoiceEnabled(!isVoiceEnabled)}
          />

          {/* Chat Window - Only this should scroll */}
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
          />

          {/* Message Input - Fixed at bottom */}
          <MessageInput
            onSend={handleSend}
            disabled={isLoading}
            isLoading={isLoading}
          />
        </div>

        {/* Weather Modal Toggle Button */}
        {weather && sessionId && (
          <button
            onClick={() => setWeatherModalOpen(true)}
            className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105 z-40"
            title={`Weather in ${city}`}
          >
            🌤️
          </button>
        )}

        {/* Weather Modal */}
        <WeatherModal
          weather={weather}
          city={city}
          isOpen={weatherModalOpen}
          onClose={() => setWeatherModalOpen(false)}
          sessionId={sessionId}
        />

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && window.innerWidth <= 768 && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
