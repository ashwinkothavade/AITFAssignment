import { useState, useEffect, useRef, useContext } from "react";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { ThemeContext } from "../App";
import {
  getSessions,
  searchMessages as apiSearch,
  renameSession as apiRename,
  deleteSession as apiDelete,
} from "../api";

export default function ChatSidebar({
  currentSessionId,
  onSelectSession,
  onNewChat,
  className = "",
}) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const editInputRef = useRef(null);
  const { darkMode } = useContext(ThemeContext);

  // Fetch chat sessions
  const fetchSessions = async () => {
    try {
      const data = await getSessions();
      if (data.ok) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Search messages
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const data = await apiSearch(searchQuery, currentSessionId || "all");
      if (data.ok) {
        setSearchResults(data.results);
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  // Delete a session
  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this chat?")) return;

    try {
      await apiDelete(sessionId);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      if (sessionId === currentSessionId) {
        onNewChat();
      }
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  // Update session name
  const handleUpdateSessionName = async (sessionId, e) => {
    e.stopPropagation();
    if (!editingName.trim()) {
      setEditingSessionId(null);
      return;
    }

    try {
      const data = await apiRename(sessionId, editingName);

      if (data.ok) {
        // Update the sessions list with the new name
        setSessions((prev) =>
          prev.map((session) =>
            session._id === sessionId
              ? { ...session, sessionName: data.sessionName }
              : session
          )
        );
      } else {
        console.error("Failed to update session name:", data.error);
        // Revert to the original name if update fails
        const originalSession = sessions.find((s) => s._id === sessionId);
        if (originalSession) {
          setEditingName(originalSession.sessionName);
        }
      }
    } catch (error) {
      console.error("Error updating session name:", error);
      // Revert to the original name on error
      const originalSession = sessions.find((s) => s._id === sessionId);
      if (originalSession) {
        setEditingName(originalSession.sessionName);
      }
    } finally {
      setEditingSessionId(null);
    }
  };

  // Start editing a session name
  const startEditing = (session, e) => {
    e.stopPropagation();
    setEditingSessionId(session._id);
    setEditingName(session.sessionName || "");

    // Focus the input after a small delay to ensure it's rendered
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 0);
  };

  // Handle key down in edit input
  const handleKeyDown = (e, sessionId) => {
    if (e.key === "Enter") {
      handleUpdateSessionName(sessionId, e);
    } else if (e.key === "Escape") {
      setEditingSessionId(null);
      setEditingName("");
    }
  };

  // Load sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Close edit mode when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editingSessionId && !e.target.closest(".editable-item")) {
        setEditingSessionId(null);
        setEditingName("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingSessionId]);

  return (
    <div
      className={`flex flex-col h-full ${
        darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"
      } ${className}`}
    >
      {/* Header */}
      <div className={`p-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <button
          onClick={onNewChat}
          className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg ${
            darkMode
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          } transition-colors`}
        >
          <PlusIcon className="h-5 w-5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`block w-full pl-10 pr-10 py-2 border ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "border-gray-300 text-gray-900 placeholder-gray-500"
              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="Search chats..."
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : searchResults ? (
          <div className="p-2">
            <div className="flex items-center justify-between px-2 py-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Search Results</span>
              <button
                onClick={() => setSearchResults(null)}
                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Clear
              </button>
            </div>
            {searchResults.map((result, idx) => (
              <div
                key={`${result._id}-${idx}`}
                className={`p-3 text-sm rounded-lg mb-1 cursor-pointer ${
                  result._id === currentSessionId
                    ? darkMode
                      ? "bg-gray-700"
                      : "bg-gray-100"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                onClick={() => {
                  onSelectSession(result._id);
                  setSearchResults(null);
                  setSearchQuery("");
                }}
              >
                <div className="font-medium line-clamp-1">
                  {sessions.find((s) => s._id === result._id)?.sessionName ||
                    "Untitled Chat"}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(
                    result.matches?.[0]?.createdAt || Date.now()
                  ).toLocaleString()}
                </div>
                <div className="text-sm mt-1 line-clamp-2 text-gray-600 dark:text-gray-300">
                  {result.matches?.[0]?.text || ""}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-2">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No chats yet</p>
                <p className="text-sm mt-2">Start a new chat to begin</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session._id}
                  className={`group relative px-3 py-2 mx-2 my-1 rounded-lg cursor-pointer ${
                    session._id === currentSessionId
                      ? darkMode
                        ? "bg-gray-700"
                        : "bg-gray-100"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => onSelectSession(session._id)}
                >
                  {editingSessionId === session._id ? (
                    <input
                      type="text"
                      ref={editInputRef}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={(e) => handleUpdateSessionName(session._id, e)}
                      onKeyDown={(e) => handleKeyDown(e, session._id)}
                      className={`w-full bg-transparent border-b border-blue-500 outline-none ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="block truncate text-sm">
                        {session.sessionName ||
                          `Chat ${new Date(
                            session.lastMessageAt
                          ).toLocaleDateString()}`}
                      </span>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => startEditing(session, e)}
                          className="p-1 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSession(session._id, e)}
                          className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 ml-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`p-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {sessions.length} {sessions.length === 1 ? "chat" : "chats"}
          </span>
          <button
            onClick={fetchSessions}
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            title="Refresh chats"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}