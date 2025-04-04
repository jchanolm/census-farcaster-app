// components/SearchInterface.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { sdk } from '@farcaster/frame-sdk';

export default function SearchInterface({ userFid, userName, displayName }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const inputRef = useRef(null);

  // Focus the input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle input change and auto-resize
  const handleInputChange = (e) => {
    setQuery(e.target.value);
    
    // Auto-resize the input
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;
    
    setIsSearching(true);
    setIsCompleted(false);
    
    // Simulate search for demo purposes
    setTimeout(() => {
      setIsSearching(false);
      setIsCompleted(true);
    }, 2000);
  };

  // Handle adding the frame
  const handleAddFrame = async () => {
    try {
      await sdk.actions.addFrame();
      console.log('App was added successfully');
    } catch (error) {
      console.error('Failed to add frame:', error);
    }
  };

  // Get dynamic background and text colors based on theme
  const bgColor = darkMode ? 'bg-black' : 'bg-[#f5f7fa]';
  const cardBg = darkMode ? 'bg-[#101018]' : 'bg-white';
  const borderColor = darkMode ? 'border-[#222230]' : 'border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-800';
  const mutedTextColor = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-[#15151f]' : 'bg-white';
  const placeholderColor = darkMode ? 'placeholder-gray-500' : 'placeholder-gray-400';

  return (
    <div className={`w-full min-h-screen ${bgColor} ${textColor} flex flex-col`}>
      {/* Header with add frame and theme toggle */}
      <header className="w-full py-3 px-4 flex items-center justify-end space-x-2">
        {/* Add frame button */}
        <button
          onClick={handleAddFrame}
          className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
          aria-label="Add frame"
        >
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"></path>
          </svg>
        </button>
        
        {/* Theme toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-full ${darkMode ? 'bg-[#1a1a25]' : 'bg-gray-200'}`}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? (
            <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
      </header>
      
      {/* Main content area */}
      <main className="flex-1 w-full max-w-md mx-auto px-5 pt-4 pb-6 flex flex-col">
        {/* App Title */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-1">Census Farcaster</h1>
          <h2 className="text-xl font-medium mb-3">App</h2>
          {userName && (
            <p className={`text-sm ${mutedTextColor} font-mono`}>
              Welcome, {displayName || userName}
            </p>
          )}
        </div>
        
        {/* Search card */}
        <div className={`${cardBg} rounded-xl border ${borderColor} p-5 shadow-sm mb-6`}>
          <div className="mb-4">
            <div className="flex items-center mb-3">
              <svg className="w-4 h-4 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <label htmlFor="search-query" className={`text-xs uppercase tracking-wider ${mutedTextColor}`}>
                QUERY
              </label>
            </div>
            
            {/* Search input */}
            <div className="relative">
              <textarea
                id="search-query"
                ref={inputRef}
                value={query}
                onChange={handleInputChange}
                placeholder="e.g. Who is building dev tools for prediction markets?"
                disabled={isSearching}
                className={`w-full ${inputBg} border ${borderColor} rounded-xl p-4 pr-12 ${textColor} focus:outline-none focus:ring-1 focus:ring-blue-500 ${placeholderColor} text-sm resize-none overflow-hidden min-h-[60px]`}
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSearch(e);
                  }
                }}
              />
              
              {/* Execute button (modern version) */}
              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearching || !query.trim()}
                className={`absolute right-3 bottom-3 rounded-lg p-2 transition-colors focus:outline-none
                ${isSearching || !query.trim() 
                  ? 'bg-[#2a2a35] text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                aria-label="Execute query"
              >
                {isSearching ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            
            <div className={`text-xs ${mutedTextColor} italic mt-2 ml-1`}>
              Tip: Short, direct queries with descriptive adjectives work best
            </div>
          </div>
          
          {/* Search status */}
          <div className={`flex items-center text-xs ${mutedTextColor} mt-3`}>
            {isSearching ? (
              <>
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                <span>Searching...</span>
              </>
            ) : isCompleted ? (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span>Query completed.</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                <span>Ready for query.</span>
              </>
            )}
          </div>
        </div>
        
        {/* Support banner at bottom */}
        <div className="mt-auto">
          <a
            href="https://www.sidequest.build/quotient"
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full flex items-center justify-center py-2.5 px-3 
                      ${darkMode ? 'bg-[#101018] text-white' : 'bg-[#f2f2f5] text-[#333]'} 
                      border ${darkMode ? 'border-[#222230]' : 'border-gray-300'} 
                      rounded-xl transition-all hover:border-blue-500 block`}
          >
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm mr-2"></div>
              <span className="text-xs uppercase tracking-wider font-mono">
                Support us on Sidequest
              </span>
            </div>
          </a>
        </div>
      </main>
    </div>
  );
}