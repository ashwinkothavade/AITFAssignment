import { useContext } from 'react';
import { ThemeContext } from '../App';

const formatDistanceToNow = (timestamp) => {
  try {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

export default function Message({ message }) {
  const { darkMode } = useContext(ThemeContext);
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] p-3 rounded-lg shadow-sm ${
          isUser
            ? darkMode
              ? 'bg-blue-600 text-white'
              : 'bg-blue-500 text-white'
            : darkMode
              ? 'bg-gray-800 text-gray-100 border border-gray-700'
              : 'bg-white text-gray-900 border border-gray-200'
        } ${message.isError ? 'border-red-500' : ''}`}
      >
        <div className="whitespace-pre-wrap break-words">
          {message.text}
        </div>
        <div
          className={`text-xs mt-1 opacity-70 ${
            isUser
              ? 'text-blue-100'
              : darkMode
                ? 'text-gray-400'
                : 'text-gray-500'
          }`}
        >
          {formatDistanceToNow(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
