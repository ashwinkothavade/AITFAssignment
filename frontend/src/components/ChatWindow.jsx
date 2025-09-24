import { useEffect, useRef, useContext } from 'react';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';
import { ThemeContext } from '../App';

export default function ChatWindow({ messages, isLoading, isVoiceEnabled, onToggleVoice }) {
  const messagesEndRef = useRef(null);
  const { darkMode } = useContext(ThemeContext);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Voice Toggle */}
      <div className={`flex justify-end p-2 border-b ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <button
          onClick={onToggleVoice}
          className={`flex items-center space-x-1 text-sm ${darkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} transition-colors`}
          aria-label={isVoiceEnabled ? 'Disable voice' : 'Enable voice'}
        >
          {isVoiceEnabled ? (
            <>
              <SpeakerWaveIcon className="h-4 w-4" />
              <span>Voice On</span>
            </>
          ) : (
            <>
              <SpeakerXMarkIcon className="h-4 w-4" />
              <span>Voice Off</span>
            </>
          )}
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-full ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className={`w-16 h-16 mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-400'}`}>
              Start a new conversation
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Type a message to begin chatting
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div 
              key={i} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-3/4 rounded-lg px-4 py-2 ${msg.role === 'user' 
                  ? `${darkMode ? 'bg-blue-600' : 'bg-blue-500'} text-white rounded-br-none` 
                  : `${darkMode ? 'bg-gray-700' : 'bg-gray-100'} ${darkMode ? 'text-gray-100' : 'text-gray-800'} rounded-bl-none`}`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div className={`text-xs mt-1 text-right ${msg.role === 'user' 
                  ? 'text-blue-200' 
                  : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {msg.timestamp ? formatTime(msg.timestamp) : formatTime(new Date())}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} ${darkMode ? 'text-gray-200' : 'text-gray-800'} rounded-lg rounded-bl-none px-4 py-2 max-w-3/4`}>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className={`w-2 h-2 ${darkMode ? 'bg-gray-400' : 'bg-gray-400'} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
                  <div className={`w-2 h-2 ${darkMode ? 'bg-gray-400' : 'bg-gray-400'} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
                  <div className={`w-2 h-2 ${darkMode ? 'bg-gray-400' : 'bg-gray-400'} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}