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

  // Get dynamic background and text colors based on theme
  const bgColor = darkMode ? 'bg-black' : 'bg-[#f5f7fa]';
  const cardBg = darkMode ? 'bg-[#121620]' : 'bg-white';
  const borderColor = darkMode ? 'border-[#2a3343]' : 'border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-800';
  const mutedTextColor = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-[#1a2030]' : 'bg-white';
  const placeholderColor = darkMode ? 'placeholder-gray-500' : 'placeholder-gray-400';

  return (
    <div className={`w-full min-h-screen ${bgColor} ${textColor} flex flex-col`}>
      {/* Header with action buttons */}
      <header className="w-full py-4 px-4 border-b border-gray-800">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-bold">Census</h1>
          </div>
          
          {/* Action buttons in header */}
          <div className="flex gap-2">
            {/* Follow button */}
            <a 
              href="https://warpcast.com/quotient" 
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
              FOLLOW
            </a>
            
            {/* Theme toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full ${darkMode ? 'bg-[#1a2030]' : 'bg-gray-200'}`}
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
          </div>
        </div>
      </header>
      
      {/* Support banner */}
      <div className="w-full px-4 py-3">
        <a
          href="https://www.sidequest.build/quotient"
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full max-w-md mx-auto flex items-center justify-center py-2 px-3 
                    ${darkMode ? 'bg-[#121620]' : 'bg-[#f2f2f5]'}
                    border ${darkMode ? 'border-gray-800' : 'border-gray-300'} 
                    rounded-md transition-all hover:border-blue-500 block`}
        >
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-sm mr-2"></div>
            <span className="text-xs uppercase tracking-wider font-mono">
              Support us on Sidequest
            </span>
          </div>
        </a>
      </div>
      
      {/* Main content area */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-2 pb-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Census</h1>
          <p className={`text-sm ${mutedTextColor}`}>Farcaster Research Tool</p>
        </div>
        
        {/* Search card */}
        <div className={`${cardBg} rounded-lg border ${borderColor} p-4 shadow-sm mb-6`}>
          {/* Search form */}
          <form onSubmit={handleSearch} className="space-y-3">
            <div>
              <label htmlFor="search-query" className={`text-xs uppercase tracking-wider ${mutedTextColor} font-semibold mb-1 block`}>
                Query
              </label>
              <textarea
                id="search-query"
                ref={inputRef}
                value={query}
                onChange={handleInputChange}
                placeholder="What do you want to know about Farcaster users?"
                disabled={isSearching}
                className={`w-full ${inputBg} border ${borderColor} rounded p-3 ${textColor} focus:outline-none focus:ring-1 focus:ring-blue-500 ${placeholderColor} text-sm resize-none overflow-hidden min-h-[60px]`}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSearch(e);
                  }
                }}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div className={`text-xs ${mutedTextColor} italic`}>
                Ask concise, specific questions
              </div>
              
              <button
                type="submit"
                disabled={isSearching || !query.trim()}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                ${isSearching || !query.trim() 
                  ? 'bg-gray-700 text-gray-300 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {isSearching ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </div>
                ) : 'Search'}
              </button>
            </div>
          </form>
          
          {/* Search status */}
          {isSearching && (
            <div className="mt-4 p-3 border border-blue-800 bg-blue-900 bg-opacity-20 rounded-md">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm text-blue-300">Processing your query...</span>
              </div>
            </div>
          )}
          
          {isCompleted && (
            <div className="mt-4 p-3 border border-green-800 bg-green-900 bg-opacity-20 rounded-md">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-green-300">Search completed successfully</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Result area would go here */}
        
        {/* Footer area */}
        <div className="mt-auto pt-4 text-center">
          <p className={`text-xs ${mutedTextColor}`}>
            For the Farcaster community
          </p>
        </div>
      </main>
    </div>
  );
}