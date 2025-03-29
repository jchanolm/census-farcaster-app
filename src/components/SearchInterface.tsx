'use client';

import { useState, useRef, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';

export default function SearchInterface() {
  const { user } = usePrivy();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [displayedQuery, setDisplayedQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set light mode by default for Palantir grey vibe
  useEffect(() => {
    setDarkMode(false);
  }, []);

  // Truncate wallet address for display
  const truncateAddress = (address: string | undefined) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

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
      
      // Use the embedding data from the API response
      setResults(data.results || []);
      setIsSearching(false);
      setIsCompleted(true);
      
    } catch (error) {
      console.error('Search error:', error);
      setIsSearching(false);
    }
  };

  // Get dynamic background and text colors based on Palantir grey vibe
  const getBgColor = () => darkMode ? 'bg-[#1a1a22]/80' : 'bg-[#f2f2f5]/90';
  const getBorderColor = () => darkMode ? 'border-[rgba(60,60,70,0.4)]' : 'border-[rgba(60,60,70,0.2)]';
  const getTextColor = () => darkMode ? 'text-white' : 'text-[#333]';
  const getTextMutedColor = () => darkMode ? 'text-[#aaa]' : 'text-[#777]';
  const getInputBgColor = () => darkMode ? 'bg-[#0a0a10]/70' : 'bg-white/80';
  const getPlaceholderColor = () => darkMode ? 'placeholder-[#666]' : 'placeholder-[#999]';

  // Score visualization
  const renderScoreGauge = (score: number) => {
    // Normalize score to 0-100 range for visualization
    // Assuming scores are between 0 and 1
    const normalizedScore = Math.min(Math.max(score * 100, 0), 100);
    
    return (
      <div className="flex items-center space-x-2">
        <div className="relative w-16 h-1.5 bg-[#e0e0e5] rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#0057ff]/70 to-[#0057ff]"
            style={{ width: `${normalizedScore}%` }}
          ></div>
        </div>
        <span className="text-xs font-mono">{score.toFixed(3)}</span>
      </div>
    );
  };

  return (
    <div className={`w-full min-h-screen ${darkMode ? 'bg-black' : 'bg-[#e5e5e8]'} ${getTextColor()} relative flex flex-col items-center`}>
      {/* Header with user wallet info */}
      <header className={`fixed top-0 left-0 right-0 flex justify-between items-center px-6 md:px-14 py-5 z-50 ${darkMode ? 'bg-gradient-to-b from-black/90 to-transparent' : 'bg-gradient-to-b from-[#e5e5e8]/90 to-transparent'}`}>
        <div className="text-xl font-bold tracking-wider">QUOTIENT</div>
        {user?.wallet?.address && (
          <div className={`${getBgColor()} px-3 py-1.5 rounded-full flex items-center space-x-2 border ${getBorderColor()}`}>
            <div className="w-2 h-2 bg-[#0057ff] rounded-full animate-pulse"></div>
            <span className="text-sm font-mono text-[#0057ff]">
              {truncateAddress(user.wallet.address)}
            </span>
          </div>
        )}
      </header>
      
      {/* Main search area */}
      <main className="pt-32 px-6 md:px-14 w-full max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Builder Intelligence</h1>
          <p className={`text-sm ${getTextMutedColor()}`}>Query the global builder constellation</p>
        </div>
        
        {/* Search box */}
        <div className={`w-full max-w-3xl mx-auto ${getBgColor()} rounded-lg border ${getBorderColor()} p-5 backdrop-blur-sm`}>
          <div className="flex items-center mb-3">
            <svg className="w-4 h-4 mr-2 opacity-80" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <div className={`text-xs uppercase tracking-wider ${getTextMutedColor()} font-semibold font-mono`}>Builder Query</div>
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
                className={`w-full ${getInputBgColor()} border ${getBorderColor()} rounded p-4 ${getTextColor()} focus:outline-none focus:border-[#0057ff] ${getPlaceholderColor()} font-mono text-sm`}
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
          <div className={`flex items-center mt-3 text-xs ${getTextMutedColor()} font-mono`}>
            {isSearching ? (
              <>
                <span className="w-2 h-2 bg-[#0057ff] rounded-full mr-2 animate-pulse"></span>
                <span>Scanning builder constellation...</span>
                <span className={`ml-2 font-mono ${getTextColor()}`}>{displayedQuery}<span className="animate-blink">_</span></span>
              </>
            ) : isCompleted ? (
              <>
                <span className="w-2 h-2 bg-[#27c93f] rounded-full mr-2"></span>
                <span>Query completed. {results.length} matching builders found.</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-[#666] rounded-full mr-2"></span>
                <span>Ready for query.</span>
              </>
            )}
          </div>
        </div>
        
        {/* Results Section */}
        {isCompleted && results.length > 0 && (
          <div className={`mt-8 max-w-3xl mx-auto ${getBgColor()} rounded-lg border ${getBorderColor()} backdrop-blur-sm overflow-hidden`}>
            {/* Results header with count */}
            <div className="flex justify-between items-center p-4 border-b border-inherit">
              <div className="flex items-center">
                <span className="text-sm font-mono font-medium">MATCHED BUILDERS</span>
                <span className="ml-2 bg-[#0057ff] text-white text-xs px-2 py-0.5 rounded-sm font-mono">
                  {results.length}
                </span>
              </div>
              <div className="flex">
                <button className="text-xs font-mono text-[#0057ff] border border-[#0057ff]/30 bg-[#0057ff]/5 px-2 py-1 rounded mr-2 hover:bg-[#0057ff]/10 transition-colors">
                  EXPORT
                </button>
                <button className="text-xs font-mono text-[#0057ff] border border-[#0057ff]/30 bg-[#0057ff]/5 px-2 py-1 rounded hover:bg-[#0057ff]/10 transition-colors">
                  FILTER
                </button>
              </div>
            </div>
            
            {/* Results summary */}
            <div className={`p-4 border-b ${getBorderColor()} ${getTextColor()}`}>
              <p className="text-sm">
                <strong>{results.length} builder profiles</strong> matched <strong>"{query}"</strong>. 
                Results are based on embedding similarity search.
              </p>
            </div>
            
            {/* Results table */}
            
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`text-xs font-mono uppercase tracking-wider ${getTextMutedColor()} border-b ${getBorderColor()}`}>
                    <tr>
                      <th className="px-4 py-3 text-left">Username</th>
                      <th className="px-4 py-3 text-left">Bio</th>
                      <th className="px-4 py-3 text-left">Location</th>
                      <th className="px-4 py-3 text-left">Relevance</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-inherit">
                    {results.map((result, index) => (
                      <tr key={index} className={`hover:${darkMode ? 'bg-[#0057ff]/5' : 'bg-[#0057ff]/5'} transition-colors`}>
                        <td className="px-4 py-4 font-mono text-[#0057ff] text-sm">
                          {result.username}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {result.bio}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {result.location || <span className="text-gray-500 font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">UNK</span>}
                        </td>
                        <td className="px-4 py-4">
                          {renderScoreGauge(result.score)}
                        </td>
                        <td className="px-4 py-4">
                          <button className="text-xs font-mono text-[#0057ff] border border-[#0057ff] px-2 py-1 rounded hover:bg-[#0057ff] hover:text-white transition-colors">
                            CONNECT
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}