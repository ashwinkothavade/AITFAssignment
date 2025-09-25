import { useState, useRef, useEffect, useContext } from 'react';
import VoiceInputButton from './VoiceInputButton';
import { ThemeContext } from '../App';

export default function MessageInput({ lang, onSend, city, disabled, isLoading }) {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const textareaRef = useRef(null);
  const { darkMode } = useContext(ThemeContext);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    
    onSend(text);
    setText('');
    
    // Reset textarea height after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Enter, but allow Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceResult = (transcript) => {
    setText(transcript);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative flex items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            className={`w-full py-3 pl-4 pr-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32 overflow-y-auto ${
              darkMode 
                ? 'bg-gray-700 text-white border border-gray-600 placeholder-gray-400' 
                : 'bg-white border border-gray-300 placeholder-gray-500'
            }`}
            placeholder={lang === "ja-JP" ? "メッセージを入力..." : "Type a message..."}
            rows="1"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
          />
          <div className="absolute right-2 bottom-2 flex items-center space-x-1">
            <VoiceInputButton
              lang={lang}
              listening={listening}
              setListening={setListening}
              onResult={handleVoiceResult}
              disabled={disabled || isLoading}
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={!text.trim() || disabled || isLoading}
          className={`ml-2 p-2 rounded-full ${
            !text.trim() || disabled || isLoading 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-600 dark:text-gray-500' 
              : 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
          }`}
          aria-label="Send message"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          )}
        </button>
      </div>
      
      {/* <div className={`mt-2 text-xs text-center ${
        darkMode ? 'text-gray-400' : 'text-gray-500'
      }`}>
        {disabled ? (
          <span>{lang === "ja-JP" ? "都市を入力してチャットを開始" : "Enter a city to start chatting"}</span>
        ) : (
          <span>{lang === "ja-JP" ? "Shift + Enter で改行" : "Shift + Enter for new line"}</span>
        )}
      </div> */}
    </form>
  );
}