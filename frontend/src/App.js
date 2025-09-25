import { useState, useEffect, createContext } from "react";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";
import LanguageSelector from "./components/LanguageSelector";
import ChatSidebar from "./components/ChatSidebar";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { getMessages as apiGetMessages, generate as apiGenerate } from "./api";

// Create a context for theme
export const ThemeContext = createContext();

export default function App() {
  const [messages, setMessages] = useState([]);
  const [lang, setLang] = useState("en-US");
  const [city, setCity] = useState("");
  const [sessionId, setSessionId] = useState(() =>
    Math.random().toString(36).slice(2)
  );
  const [sessionName, setSessionName] = useState("New Chat");
  const [showSidebar, setShowSidebar] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("darkMode") === "true" ||
        (!localStorage.getItem("darkMode") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    }
    return false;
  });

  // Apply dark mode class to HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [darkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  // Fetch messages for the current session
  const fetchMessages = async (sessionId) => {
    try {
      const data = await apiGetMessages(sessionId);
      if (data.ok) {
        setMessages(data.messages);
        if (data.sessionName) {
          setSessionName(data.sessionName);
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Initialize or load session
  useEffect(() => {
    if (sessionId) {
      fetchMessages(sessionId);
    }
  }, [sessionId]);

  // Toggle voice functionality
  // const toggleVoice = () => {
  //   setIsVoiceEnabled((prev) => !prev);
  // };

  const speak = (text, lang) => {
    if (!window.speechSynthesis || !isVoiceEnabled) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = lang;
    window.speechSynthesis.speak(utter);
  };

  // Enhanced city extraction function
  const extractCityFromMessage = (message) => {
    if (!message) return null;

    // Common patterns for city mentions
    const patterns = [
      // Patterns like "in New York", "at Tokyo"
      /(?:in|at|from|for|about|near|around|close to|in the city of|in the town of)\s+([A-Z][a-zA-Z\s-]+[a-z])(?=\s*\?|\s*$|\s*!|\s*,|\s*\.|\s+in\s+the|\s+on\s+the)/i,
      // Patterns like "weather in Tokyo", "hotels in Paris"
      /(weather|forecast|hotel|restaurant|attraction|place|city|town|visit|see|explore|travel to|go to|going to|flying to|visiting|staying in|staying at|staying near|staying around|staying close to|staying in the city of|staying in the town of)\s+(?:in|at|from|for|about|near|around|close to|in the city of|in the town of)?\s*([A-Z][a-zA-Z\s-]+[a-z])(?=\s*\?|\s*$|\s*!|\s*,|\s*\.|\s+in\s+the|\s+on\s+the)/i,
      // Direct city mentions
      /^([A-Z][a-zA-Z\s-]+[a-z])(?:\s*\?|\s*$|\s*!|\s*,|\s*\.|\s+in\s+the|\s+on\s+the)/i,
    ];

    // Try each pattern until we find a match
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        // The city is usually in the last capturing group
        const cityMatch = match[match.length - 1].trim();
        if (cityMatch && cityMatch.length > 1) {
          // Clean up the city name (remove any trailing punctuation)
          return cityMatch.replace(/[^\w\s-]/g, "").trim();
        }
      }
    }

    return null;
  };

  // Send message handler
  const handleSendMessage = async (userText) => {
    if (!userText.trim()) return;

    // Extract city from message if not already set
    let targetCity = city;
    if (!targetCity) {
      const extractedCity = extractCityFromMessage(userText);
      if (extractedCity) {
        targetCity = extractedCity;
        setCity(targetCity);
      }
    }

    // Create user message in UI immediately
    const userMessage = {
      role: "user",
      text: userText,
      lang,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const data = await apiGenerate({
        message: userText,
        lang,
        city: targetCity, // may be undefined
        sessionId,
      });

      if (data.output) {
        const aiMessage = {
          role: "ai",
          text: data.output,
          lang,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMessage]);

        // Optionally speak the response
        if (isVoiceEnabled) {
          speak(aiMessage.text, lang);
        }

        // If backend returns a canonical sessionName and this is a new chat, update it
        if (data.sessionName && sessionName === "New Chat") {
          setSessionName(data.sessionName);
        }
      } else {
        throw new Error(data.error || "No response from server");
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = {
        role: "ai",
        text: lang.startsWith("ja")
          ? "申し訳ありませんが、エラーが発生しました。もう一度お試しください。"
          : "Sorry, an error occurred. Please try again.",
        lang,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new chat session
  const handleNewChat = () => {
    const newSessionId = Math.random().toString(36).slice(2);
    setSessionId(newSessionId);
    setSessionName("New Chat");
    setMessages([]);
    setCity("");
    setShowSidebar(false);
  };

  // Load an existing chat session
  // const handleSelectSession = (selectedSessionId) => {
  //   setSessionId(selectedSessionId);
  //   setShowSidebar(false);
  // };

  // Toggle sidebar visibility on mobile
  // const toggleSidebar = () => {
  //   setShowSidebar(!showSidebar);
  // };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <div
        className={`flex h-screen w-full overflow-hidden ${
          darkMode ? "dark bg-gray-900" : "bg-gray-50"
        }`}
      >
        {/* Sidebar */}
        <div
          className={`transform ${
            showSidebar ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 fixed md:static inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30 transition-transform duration-300 ease-in-out`}
        >
          <ChatSidebar
            currentSessionId={sessionId}
            onSelectSession={(id) => {
              setSessionId(id);
              setShowSidebar(false);
            }}
            onNewChat={handleNewChat}
            className="h-full"
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                aria-label="Toggle sidebar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM9 15a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {sessionName}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {lang === "ja-JP" ? "音声" : "Voice"}
                </span>
                <button
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isVoiceEnabled
                      ? "bg-blue-600"
                      : "bg-gray-200 dark:bg-gray-600"
                  }`}
                  role="switch"
                  aria-checked={isVoiceEnabled}
                  aria-label={isVoiceEnabled ? "Disable voice" : "Enable voice"}
                >
                  <span
                    className={`${
                      isVoiceEnabled ? "translate-x-6" : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </button>
              </div>

              <LanguageSelector lang={lang} setLang={setLang} />

              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none"
                aria-label={
                  darkMode ? "Switch to light mode" : "Switch to dark mode"
                }
              >
                {darkMode ? (
                  <SunIcon className="h-5 w-5 text-yellow-300" />
                ) : (
                  <MoonIcon className="h-5 w-5 text-gray-700" />
                )}
              </button>
            </div>
          </header>

          {/* Chat Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <ChatWindow
              messages={messages}
              isLoading={isLoading}
              isVoiceEnabled={isVoiceEnabled}
              onToggleVoice={() => setIsVoiceEnabled(!isVoiceEnabled)}
            />

            {/* Input Area */}
            <div
              className={`px-4 py-3 border-t ${
                darkMode
                  ? "border-gray-700 bg-gray-800"
                  : "border-gray-200 bg-white"
              }`}
            >
              <MessageInput
                lang={lang}
                onSend={handleSendMessage}
                city={city}
                disabled={isLoading}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Overlay for mobile sidebar */}
        {showSidebar && (
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setShowSidebar(false)}
          />
        )}
      </div>
    </ThemeContext.Provider>
  );
}
