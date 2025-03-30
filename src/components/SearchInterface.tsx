/* eslint-disable */

'use client';

import { useState, useRef, useEffect } from 'react';
import BuilderResultsTable from './BuilderResultsTable';
import DataScreeningAnimation from './DataScreeningAnimation';

export default function SearchInterface() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [displayedQuery, setDisplayedQuery] = useState('');
  const [results, setResults] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set light mode by default for Palantir grey vibe
  useEffect(() => {
    setDarkMode(false);
  }, []);

  // Focus the input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Typewriter effect for query
  useEffect(() => {
    if (isSearching && displayedQuery.length < query.length) {
      const timer = setTimeout(() => {
        setDisplayedQuery(query.substring(0, displayedQuery.length + 1));
      }, 30);
      
      return () => clearTimeout(timer);
    }
  }, [displayedQuery, query, isSearching]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;
    
    setIsSearching(true);
    setIsCompleted(false);
    setDisplayedQuery('');
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() })
      });
      
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      
      const data = await response.json();
      console.log('Search API response:', data);
      
      // Delay to show the animation for a minimum time
      setTimeout(() => {
        setResults(data.results || []);
        setIsSearching(false);
        setIsCompleted(true);
      }, 2500); // Minimum 2.5 seconds to show animation
      
    } catch (error) {
      console.error('Search error:', error);
      setIsSearching(false);
    }
  };

  // Toggle dark/light mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Get dynamic background and text colors based on Palantir grey vibe
  const bgColorWithOpacity = darkMode ? 'bg-black bg-opacity-80' : 'bg-[#f2f2f5] bg-opacity-90';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-300';
  const textColor = darkMode ? 'text-white' : 'text-[#333]';
  const textMutedColor = darkMode ? 'text-[#aaa]' : 'text-[#777]';
  const inputBgWithOpacity = darkMode ? 'bg-[#0a0a10] bg-opacity-70' : 'bg-white bg-opacity-80';
  const placeholderColor = darkMode ? 'placeholder-[#666]' : 'placeholder-[#999]';

  return (
    <div className={`w-full min-h-screen ${darkMode ? 'bg-black' : 'bg-[#e5e5e8]'} ${textColor} relative flex flex-col items-center`}>
      {/* Header with theme toggle */}
      <header className="w-full py-4 px-6 flex justify-end">
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}
        >
          {darkMode ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
      </header>
      
      {/* Main search area */}
      <main className="pt-16 px-6 md:px-14 w-full max-w-5xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Builder Intelligence</h1>
          <p className={`text-sm ${textMutedColor}`}>Query the global builder constellation</p>
        </div>
        
        {/* Search box */}
        <div className={`w-full max-w-3xl mx-auto ${bgColorWithOpacity} rounded-lg border ${borderColor} p-5 backdrop-blur-sm mb-6`}>
          <div className="flex items-center mb-3">
            <svg className="w-4 h-4 mr-2 opacity-80" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <div className={`text-xs uppercase tracking-wider ${textMutedColor} font-semibold font-mono`}>Builder Query</div>
          </div>
          
          <form onSubmit={handleSearch} className="mb-3">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Find Frame developers building on Base..."
                disabled={isSearching}
                className={`w-full ${inputBgWithOpacity} border ${borderColor} rounded p-4 ${textColor} focus:outline-none focus:border-[#0057ff] ${placeholderColor} font-mono text-sm`}
              />
              <button
                type="submit"
                disabled={isSearching || !query.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#0057ff] text-white px-4 py-2 rounded text-xs uppercase tracking-wider font-mono hover:bg-[#0046cc] transition-colors disabled:opacity-50 disabled:hover:bg-[#0057ff]"
              >
                Execute
              </button>
            </div>
          </form>
          
          {/* Search status */}
          <div className={`flex items-center mt-3 text-xs ${textMutedColor} font-mono`}>
            {isSearching ? (
              <>
                <span className="w-2 h-2 bg-[#0057ff] rounded-full mr-2 animate-pulse"></span>
                <span>Scanning builder constellation...</span>
                <span className={`ml-2 font-mono ${textColor}`}>{displayedQuery}<span className="animate-blink">_</span></span>
              </>
            ) : isCompleted ? (
              <>
                <span className="w-2 h-2 bg-[#27c93f] rounded-full mr-2"></span>
                <span>Query completed. {results.length} matching builders found.</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                <span>Ready for query.</span>
              </>
            )}
          </div>
        </div>
        
        {/* Data Screening Animation */}
        {isSearching && (
          <div className={`w-full max-w-3xl mx-auto ${bgColorWithOpacity} rounded-lg border ${borderColor} backdrop-blur-sm overflow-hidden`}>
            <div className="p-2 border-b border-inherit">
              <div className={`text-xs uppercase tracking-wider ${textMutedColor} font-mono`}>
                Builder Data Processing
              </div>
            </div>
            <DataScreeningAnimation isActive={isSearching} darkMode={darkMode} />
          </div>
        )}
        
        {/* Results Section */}
        {isCompleted && results.length > 0 && (
          <BuilderResultsTable 
            results={results} 
            query={query} 
            darkMode={darkMode} 
          />
        )}
      </main>
    </div>
  );
}