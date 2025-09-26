import { useState, useRef, useEffect, useContext } from 'react';
import { Palette } from 'lucide-react';
import { ThemeContext } from '../App';

const THEMES = [
  { id: 'travel', name: 'Travel', icon: '✈️', description: 'Trip planning & destinations' },
  { id: 'fashion', name: 'Fashion', icon: '👔', description: 'Outfit recommendations' },
  { id: 'sports', name: 'Sports', icon: '🏃', description: 'Activity suggestions' },
  { id: 'agriculture', name: 'Agriculture', icon: '🌾', description: 'Farming advice' },
  { id: 'events', name: 'Events', icon: '🎉', description: 'Event planning' },
  { id: 'health', name: 'Health', icon: '💊', description: 'Wellness tips' }
];

export default function ThemeSelector() {
  const { theme, setTheme, darkMode } = useContext(ThemeContext);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const current = THEMES.find(t => t.id === theme) || THEMES[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme.id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          darkMode
            ? 'hover:bg-gray-700 text-gray-300'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
        aria-label="Select theme"
      >
        <span className="text-base">{current.icon}</span>
        <span className="hidden sm:inline">{current.name}</span>
        <Palette size={16} className="ml-1" />
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 z-50 ${
          darkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}>
          <div className="p-2">
            <div className={`text-xs font-semibold mb-2 px-2 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Choose Theme
            </div>
            <div className="space-y-1">
              {THEMES.map((themeOption) => (
                <button
                  key={themeOption.id}
                  onClick={() => handleThemeChange(themeOption)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    themeOption.id === theme
                      ? darkMode
                        ? 'bg-blue-900/50 text-blue-300 border border-blue-700'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                      : darkMode
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="text-lg">{themeOption.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{themeOption.name}</div>
                    <div className={`text-xs truncate ${
                      themeOption.id === theme
                        ? darkMode
                          ? 'text-blue-400'
                          : 'text-blue-600'
                        : darkMode
                          ? 'text-gray-400'
                          : 'text-gray-500'
                    }`}>
                      {themeOption.description}
                    </div>
                  </div>
                  {themeOption.id === theme && (
                    <div className={`w-2 h-2 rounded-full ${
                      darkMode ? 'bg-blue-400' : 'bg-blue-500'
                    }`} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
