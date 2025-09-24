import { useEffect, useContext } from 'react';
import { ThemeContext } from '../App';

export default function VoiceInputButton({ 
  lang, 
  listening, 
  setListening, 
  onResult, 
  disabled = false 
}) {
  const { darkMode } = useContext(ThemeContext);

  useEffect(() => {
    // Clean up speech recognition on unmount
    return () => {
      if (window.SpeechRecognition || window.webkitSpeechRecognition) {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Your browser does not support speech recognition. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = lang || 'en-US';

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onResult) {
        onResult(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setListening(false);
    }
  };

  const stopListening = () => {
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.stop();
    }
    setListening(false);
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      className={`p-1.5 rounded-full transition-colors ${
        disabled 
          ? 'cursor-not-allowed text-gray-400 dark:text-gray-600' 
          : listening 
            ? 'text-white bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700' 
            : `text-gray-600 hover:text-blue-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`
      }`}
      aria-label={listening ? 'Stop listening' : 'Start voice input'}
    >
      {listening ? (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path 
            fillRule="evenodd" 
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-2 0v6a1 1 0 002 0V7zm6 0a1 1 0 00-2 0v6a1 1 0 002 0V7z" 
            clipRule="evenodd" 
          />
        </svg>
      ) : (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path 
            fillRule="evenodd" 
            d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" 
            clipRule="evenodd" 
          />
        </svg>
      )}
      {listening && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}
    </button>
  );
}