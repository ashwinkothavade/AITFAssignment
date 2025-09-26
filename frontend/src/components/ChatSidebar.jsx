import { useState, useEffect, useRef, useContext } from "react";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { ThemeContext } from "../App";
import api from "../api"; // This should import your existing api/index.js

export default function ChatSidebar({
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  className = "",
}) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [deletingSessionId, setDeletingSessionId] = useState(null);
  const editInputRef = useRef(null);
  const { darkMode } = useContext(ThemeContext);

  // Fetch chat sessions
  const fetchSessions = async () => {
    try {
      console.log('Fetching sessions...');
      const data = await api.getSessions();
      console.log('Sessions response:', data);
      
      if (data && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
      } else if (Array.isArray(data)) {
        setSessions(data);
      } else {
        console.error('Unexpected sessions response format:', data);
        setSessions([]);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setSessions([]);
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
      const filteredSessions = sessions.filter(session =>
        session.sessionName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filteredSessions);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  // Delete a session
  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    
    if (!sessionId) {
      console.error('No session ID provided for deletion');
      return;
    }

    if (!window.confirm("Are you sure you want to delete this chat?")) return;

    setDeletingSessionId(sessionId);
    
    try {
      console.log('Deleting session with ID:', sessionId);
      
      // Use the existing API deleteSession method
      const response = await api.deleteSession(sessionId);
      console.log('Delete response:', response);
      
      // The response should indicate success
      // Update local state - remove the deleted session
      setSessions((prev) => {
        const filtered = prev.filter((s) => {
          // Handle both _id and sessionId fields for compatibility
          const sId = s._id || s.sessionId || s.id;
          return sId !== sessionId;
        });
        console.log('Sessions after deletion:', filtered);
        return filtered;
      });

      // Clear search results if it contained the deleted session
      if (searchResults) {
        setSearchResults(prev => prev ? prev.filter(s => {
          const sId = s._id || s.sessionId || s.id;
          return sId !== sessionId;
        }) : null);
      }

      // If we deleted the current session, start a new chat
      if (sessionId === currentSessionId) {
        console.log('Deleted current session, starting new chat');
        onNewChat();
      }

      // Call the parent's delete handler if provided (for additional cleanup)
      if (onDeleteSession) {
        try {
          await onDeleteSession(sessionId);
        } catch (error) {
          console.warn('Parent delete handler failed:', error);
        }
      }

      console.log('Session deleted successfully');
      
    } catch (error) {
      console.error("Error deleting session:", error);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Failed to delete chat: ${errorMessage}`);
    } finally {
      setDeletingSessionId(null);
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
      const data = await api.renameSession(sessionId, editingName);
      console.log('Rename response:', data);
      
      if (data && (data.sessionName || data.name)) {
        setSessions((prev) =>
          prev.map((session) => {
            const sId = session._id || session.sessionId || session.id;
            return sId === sessionId
              ? { ...session, sessionName: data.sessionName || data.name }
              : session;
          })
        );
      } else {
        throw new Error('Invalid rename response');
      }
    } catch (error) {
      console.error("Error updating session name:", error);
      const originalSession = sessions.find((s) => {
        const sId = s._id || s.sessionId || s.id;
        return sId === sessionId;
      });
      if (originalSession) {
        setEditingName(originalSession.sessionName || "");
      }
      alert(`Failed to rename chat: ${error.message}`);
    } finally {
      setEditingSessionId(null);
    }
  };

  // Start editing a session name
  const startEditing = (session, e) => {
    e.stopPropagation();
    const sessionId = session._id || session.sessionId || session.id;
    setEditingSessionId(sessionId);
    setEditingName(session.sessionName || "");
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

  // Refresh sessions when currentSessionId changes (new session created)
  useEffect(() => {
    if (currentSessionId) {
      fetchSessions();
    }
  }, [currentSessionId]);

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

  const formatDate = (dateString) => {
    try {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      const now = new Date();
      const diffInMs = now - date;
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffInDays < 7) {
        return `${diffInDays}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  return (
    <div
      className={`h-full ${
        darkMode 
          ? 'bg-gray-900 border-gray-700' 
          : 'bg-white border-gray-200'
      } border-r flex flex-col overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className={`p-4 border-b flex-shrink-0 ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <button
          onClick={onNewChat}
          className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl font-medium transition-colors ${
            darkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          <PlusIcon className="w-5 h-5" />
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className={`px-4 py-3 border-b flex-shrink-0 ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className={`w-full pl-10 pr-10 py-2 rounded-lg text-sm transition-colors ${
              darkMode
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
            } border focus:ring-2 focus:ring-opacity-50`}
          />
          <MagnifyingGlassIcon className={`absolute left-3 top-2.5 w-4 h-4 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchResults(null);
              }}
              className={`absolute right-3 top-2.5 ${
                darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Loading chats...
            </div>
          </div>
        ) : (
          <div className="p-2">
            {(searchResults || sessions).length === 0 ? (
              <div className="p-8 text-center">
                <div className={`text-4xl mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                  💬
                </div>
                <div className={`text-sm font-medium mb-1 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  No chats yet
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Start a new chat to begin
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {(searchResults || sessions).map((session) => {
                  const sessionId = session._id || session.sessionId || session.id;
                  const isDeleting = deletingSessionId === sessionId;
                  
                  if (!sessionId) {
                    console.warn('Session without ID found:', session);
                    return null;
                  }
                  
                  return (
                    <div
                      key={sessionId}
                      onClick={() => !isDeleting && onSelectSession(sessionId)}
                      className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors editable-item ${
                        sessionId === currentSessionId
                          ? darkMode
                            ? 'bg-blue-900/50 border border-blue-700'
                            : 'bg-blue-50 border border-blue-200'
                          : darkMode
                            ? 'hover:bg-gray-800'
                            : 'hover:bg-gray-50'
                      } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        {editingSessionId === sessionId ? (
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, sessionId)}
                            onBlur={(e) => handleUpdateSessionName(sessionId, e)}
                            className={`w-full px-2 py-1 text-sm rounded border ${
                              darkMode
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <>
                            <div className={`text-sm font-medium truncate ${
                              sessionId === currentSessionId
                                ? darkMode
                                  ? 'text-blue-300'
                                  : 'text-blue-700'
                                : darkMode
                                  ? 'text-gray-200'
                                  : 'text-gray-900'
                            }`}>
                              {session.sessionName || session.name || "Untitled Chat"}
                            </div>
                            <div className={`text-xs truncate mt-0.5 ${
                              sessionId === currentSessionId
                                ? darkMode
                                  ? 'text-blue-400'
                                  : 'text-blue-600'
                                : darkMode
                                  ? 'text-gray-500'
                                  : 'text-gray-500'
                            }`}>
                              {formatDate(session.lastMessageAt || session.updatedAt || session.createdAt)}
                            </div>
                          </>
                        )}
                      </div>

                      {!isDeleting && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => startEditing(session, e)}
                            className={`p-1.5 rounded-md transition-colors ${
                              darkMode
                                ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                                : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                            }`}
                            title="Rename chat"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteSession(sessionId, e)}
                            className={`p-1.5 rounded-md transition-colors ${
                              darkMode
                                ? 'hover:bg-red-900/50 text-red-400 hover:text-red-300'
                                : 'hover:bg-red-100 text-red-500 hover:text-red-700'
                            }`}
                            title="Delete chat"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      
                      {isDeleting && (
                        <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          Deleting...
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
