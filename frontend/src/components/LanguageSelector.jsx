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
  { id: 'ko-KR', name: '한국어', flag: '🇰🇷' },
  { id: 'zh-CN', name: '中文', flag: '🇨🇳' },
  { id: 'it-IT', name: 'Italiano', flag: '🇮🇹' },
  { id: 'pt-BR', name: 'Português', flag: '🇧🇷' },
  { id: 'ru-RU', name: 'Русский', flag: '🇷🇺' },
];

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { darkMode, lang, setLang } = useContext(ThemeContext); // Get from context

  const selectedLanguage = languages.find(l => l.id === lang) || languages[0];

  const handleChange = (language) => {
    setLang(language.id);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Listbox value={selectedLanguage} onChange={handleChange}>
        <div className="relative">
          <Listbox.Button
            className={`relative w-full cursor-pointer rounded-lg py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm ${
              darkMode
                ? 'bg-gray-700 text-white border-gray-600'
                : 'bg-white text-gray-900 border-gray-300'
            }`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="flex items-center">
              <span className="mr-2 text-lg">{selectedLanguage.flag}</span>
              <span className="block truncate">{selectedLanguage.name}</span>
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDownIcon
                className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}
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
          >
            <Listbox.Options
              className={`absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm ${
                darkMode
                  ? 'bg-gray-700 border-gray-600'
                  : 'bg-white border-gray-300'
              }`}
            >
              {languages.map((language) => (
                <Listbox.Option
                  key={language.id}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                      active
                        ? darkMode
                          ? 'bg-gray-600 text-white'
                          : 'bg-amber-100 text-amber-900'
                        : darkMode
                        ? 'text-gray-200'
                        : 'text-gray-900'
                    }`
                  }
                  value={language}
                  onClick={() => handleChange(language)}
                >
                  {({ selected }) => (
                    <>
                      <span className="flex items-center">
                        <span className="mr-3 text-lg">{language.flag}</span>
                        <span
                          className={`block truncate ${
                            selected ? 'font-medium' : 'font-normal'
                          }`}
                        >
                          {language.name}
                        </span>
                      </span>
                      {selected ? (
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                            darkMode ? 'text-blue-400' : 'text-amber-600'
                          }`}
                        >
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
      </Listbox>
    </div>
  );
}
