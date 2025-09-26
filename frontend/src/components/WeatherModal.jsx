import React from 'react';
import { Thermometer, Droplets, Wind, Eye, Cloud, MapPin, X } from 'lucide-react';

export default function WeatherModal({ weather, city, theme, isOpen, onClose, sessionId }) {
  if (!weather || !city || !isOpen) return null;

  const getThemeIcon = () => {
    const icons = {
      travel: '✈️',
      fashion: '👔',
      sports: '🏃',
      agriculture: '🌾',
      events: '🎉',
      health: '💊'
    };
    return icons[theme] || '🌤️';
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 m-4 max-w-md w-full shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close weather modal"
        >
          <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </button>

        {/* Weather Content */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {city}
            </h2>
            <span className="text-2xl">{getThemeIcon()}</span>
          </div>
          
          <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            {weather.temperature}°C
          </div>
          
          <div className="text-gray-600 dark:text-gray-300 capitalize mb-4">
            {weather.description}
          </div>
        </div>

        {/* Weather Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Thermometer className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Feels like</span>
            </div>
            <div className="font-semibold text-gray-800 dark:text-white">
              {weather.feelsLike}°C
            </div>
          </div>

          <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="h-4 w-4 text-cyan-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Humidity</span>
            </div>
            <div className="font-semibold text-gray-800 dark:text-white">
              {weather.humidity}%
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Wind className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Wind</span>
            </div>
            <div className="font-semibold text-gray-800 dark:text-white">
              {weather.windSpeed} km/h {weather.windDirection}
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Visibility</span>
            </div>
            <div className="font-semibold text-gray-800 dark:text-white">
              {weather.visibility}
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Weather data for this chat session
          </p>
        </div>
      </div>
    </div>
  );
}
