import { useContext } from 'react';
import { ThemeContext } from '../App';

export default function EmptyChat() {
  const { theme, darkMode } = useContext(ThemeContext); // Added darkMode here
  
  const suggestions = {
    travel: [
      "What's the best time to visit Tokyo?",
      "Plan a weekend trip to Paris",
      "Beach destinations with perfect weather"
    ],
    fashion: [
      "What should I wear today?",
      "Outfit ideas for rainy weather",
      "Professional wardrobe essentials"
    ],
    sports: [
      "Best time for morning runs?",
      "Indoor workout alternatives",
      "Weather for this weekend's game"
    ],
    agriculture: [
      "When should I plant tomatoes?",
      "Frost warning for my crops",
      "Best crops for current season"
    ],
    events: [
      "Plan an outdoor wedding",
      "Weather for Saturday's event",
      "Backup plans for rain"
    ],
    health: [
      "UV index and sun protection",
      "Air quality for exercise",
      "Weather and allergies"
    ]
  };

  const currentSuggestions = suggestions[theme] || suggestions.travel;

  return (
    <div className={`flex-1 flex items-center justify-center p-8 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <div className="text-6xl mb-4">🌤️</div>
          <h2 className={`text-2xl font-bold mb-2 ${
            darkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Weather Assistant
          </h2>
          <p className={`${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Ask me anything about weather and I'll provide personalized {theme} recommendations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currentSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg cursor-pointer transition-colors ${
                darkMode 
                  ? 'bg-gray-800 hover:bg-gray-700' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => {
                // You can add a function to handle suggestion clicks
                // onSuggestionClick(suggestion);
              }}
            >
              <p className={`text-sm ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                "{suggestion}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}