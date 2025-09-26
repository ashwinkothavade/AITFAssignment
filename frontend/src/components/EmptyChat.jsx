import { useContext } from 'react';
import { ThemeContext } from '../App'; // Changed from AppContext to ThemeContext

export default function EmptyChat() {
  const { theme } = useContext(ThemeContext); // Changed from AppContext to ThemeContext
  
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
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <div className="text-6xl mb-4">🌤️</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Weather Assistant
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Ask me anything about weather and I'll provide personalized {theme} recommendations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currentSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              onClick={() => {
                // You can add a function to handle suggestion clicks
                // onSuggestionClick(suggestion);
              }}
            >
              <p className="text-sm text-gray-700 dark:text-gray-300">
                "{suggestion}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
