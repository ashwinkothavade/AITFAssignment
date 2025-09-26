import { useContext } from 'react';
import { ThemeContext } from '../App';
import LanguageSelector from './LanguageSelector';
import ThemeSelector from './ThemeSelector';
import { Menu, Sun, Moon, Volume2, VolumeX } from 'lucide-react';

export default function Header({ 
  sessionName, 
  sidebarOpen, 
  setSidebarOpen, 
  isVoiceEnabled, 
  onToggleVoice 
}) {
  const {
    darkMode,
    setDarkMode
  } = useContext(ThemeContext);

  return (
    <header className={`flex-shrink-0 border-b transition-colors duration-200 ${
      darkMode 
        ? 'bg-gray-900/95 border-gray-700 backdrop-blur-sm' 
        : 'bg-white/95 border-gray-200 backdrop-blur-sm'
    }`}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          
          <h1 className={`font-semibold text-lg truncate max-w-48 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {sessionName}
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ThemeSelector />
          
          {/* Voice Toggle */}
          <button
            onClick={onToggleVoice}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isVoiceEnabled
                ? darkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
                : darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
            aria-label="Toggle voice"
          >
            {isVoiceEnabled ? (
              <Volume2 size={16} />
            ) : (
              <VolumeX size={16} />
            )}
            <span className="hidden sm:inline">
              Voice {isVoiceEnabled ? 'On' : 'Off'}
            </span>
          </button>
          
          {/* Dark/Light Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? 'hover:bg-gray-700 text-yellow-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
