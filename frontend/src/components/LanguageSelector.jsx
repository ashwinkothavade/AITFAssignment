import { Fragment, useState, useContext } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { ThemeContext } from '../App';

const languages = [
  { id: 'en-US', name: 'English', flag: '🇺🇸' },
  { id: 'ja-JP', name: '日本語', flag: '🇯🇵' },
  { id: 'es-ES', name: 'Español', flag: '🇪🇸' },
  { id: 'fr-FR', name: 'Français', flag: '🇫🇷' },
  { id: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
];

export default function LanguageSelector({ lang, setLang }) {
  const [isOpen, setIsOpen] = useState(false);
  const { darkMode } = useContext(ThemeContext);
  const selectedLanguage = languages.find(l => l.id === lang) || languages[0];

  const handleChange = (language) => {
    setLang(language.id);
    setIsOpen(false);
  };

  return (
    <Listbox value={selectedLanguage} onChange={handleChange}>
      {({ open }) => (
        <div className="relative">
          <Listbox.Button 
            className={`relative w-32 cursor-default rounded-lg py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm ${
              darkMode 
                ? 'bg-gray-700 text-white border border-gray-600' 
                : 'bg-white border border-gray-300 text-gray-900'
            }`}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Select language"
          >
            <span className="flex items-center">
              <span className="text-lg mr-2">{selectedLanguage.flag}</span>
              <span className="block truncate">{selectedLanguage.name}</span>
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDownIcon 
                className={`h-5 w-5 transition-transform ${isOpen ? 'transform rotate-180' : ''} ${
                  darkMode ? 'text-gray-300' : 'text-gray-400'
                }`} 
                aria-hidden="true" 
              />
            </span>
          </Listbox.Button>

          <Transition
            show={isOpen}
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setIsOpen(false)}
          >
            <Listbox.Options 
              className={`absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md py-1 text-base shadow-lg ring-1 ring-opacity-5 focus:outline-none sm:text-sm ${
                darkMode 
                  ? 'bg-gray-800 ring-gray-700' 
                  : 'bg-white ring-black'
              }`}
            >
              {languages.map((language) => (
                <Listbox.Option
                  key={language.id}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active 
                        ? darkMode 
                          ? 'bg-gray-700 text-white' 
                          : 'bg-blue-100 text-blue-900'
                        : darkMode 
                          ? 'text-gray-100' 
                          : 'text-gray-900'
                    }`
                  }
                  value={language}
                >
                  {({ selected }) => (
                    <>
                      <span className="flex items-center">
                        <span className="text-lg mr-2">{language.flag}</span>
                        <span
                          className={`block truncate ${
                            selected ? 'font-medium' : 'font-normal'
                          }`}
                        >
                          {language.name}
                        </span>
                      </span>
                      {selected ? (
                        <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                          darkMode ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  );
}