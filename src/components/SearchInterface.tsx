'use client';

import { useState, useRef, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import SearchResults from './SearchResults';

export default function SearchInterface() {
  const { user } = usePrivy();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [displayedQuery, setDisplayedQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [darkMode, setDarkMode] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check for user preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(isDarkMode);
      
      // Listen for changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => setDarkMode(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;
    
    setIsSearching(true);
    setIsCompleted(false);
    setDisplayedQuery('');
    
    // Mock search results
    const mockResults = [
      {
        address: 'framedev.eth',
        accounts: 'GitHub: @framedev, Warpcast: @framebuilder',
        relevance: 'Created 3 popular prediction market frames on Base with active Warpcast presence'
      },
      {
        address: 'predictoracle.eth',
        accounts: 'GitHub: @predict-labs, Warpcast: @predict',
        relevance: 'Self-funded Frame developer specializing in financial prediction markets on Base'
      },
      {
        address: '0x7f8d42e3b1',
        accounts: 'GitHub: @0xmarkets, Warpcast: @markets',
        relevance: 'Contributed to Base prediction market protocols and Frame SDK'
      },
      {
        address: 'castbuilder.eth',
        accounts: 'GitHub: @castbuilder, Warpcast: @caststack',
        relevance: 'Created multiple Frames for on-chain betting markets with Base integration'
      },
      {
        address: 'metapredictor.eth',
        accounts: 'GitHub: @metadev, Warpcast: @predictor',
        relevance: 'Built social prediction infra for Frames, active daily on Warpcast'
      }
    ];
    
    // Simulate API call
    setTimeout(() => {
      setResults(mockResults);
      setIsSearching(false);
      setIsCompleted(true);
    }, 2000);
  };

  // Get dynamic background and text colors based on system preference
  const getBgColor = () => darkMode ? 'bg-[#1a1a22]/80' : 'bg-[#f0f0f4]/90';
  const getBorderColor = () => darkMode ? 'border-[rgba(60,60,70,0.4)]' : 'border-[rgba(60,60,70,0.15)]';
  const getTextColor = () => darkMode ? 'text-white' : 'text-[#111]';
  const getTextMutedColor = () => darkMode ? 'text-[#aaa]' : 'text-[#666]';
  const getInputBgColor = () => darkMode ? 'bg-[#0a0a10]/70' : 'bg-white/70';
  const getPlaceholderColor = () => darkMode ? 'placeholder-[#666]' : 'placeholder-[#999]';

  return (
    <div className={`w-full min-h-screen ${darkMode ? 'bg-black' : 'bg-[#eaeaef]'} ${getTextColor()} relative`}>
      {/* Header with user wallet info */}
      <header className={`fixed top-0 left-0 right-0 flex justify-between items-center px-6 md:px-14 py-5 z-50 ${darkMode ? 'bg-gradient-to-b from-black/90 to-transparent' : 'bg-gradient-to-b from-[#eaeaef]/90 to-transparent'}`}>
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
      <main className="pt-32 px-6 md:px-14">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Builder Intelligence</h1>
          <p className={`text-sm ${getTextMutedColor()}`}>Query the global builder constellation</p>
        </div>
        
        {/* Search box */}
        <div className={`w-full max-w-3xl ${getBgColor()} rounded-lg border ${getBorderColor()} p-5 backdrop-blur-sm`}>
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
          <div className={`mt-8 max-w-3xl ${getBgColor()} rounded-lg border ${getBorderColor()} backdrop-blur-sm overflow-hidden`}>
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
                <strong>5 builder profiles</strong> matched <strong>"Frame developers building prediction market tools on Base"</strong>. 
                Common traits: Farcaster accounts, prediction market development experience, Base network integration.
              </p>
            </div>
            
            {/* Results table */}
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`text-xs font-mono uppercase tracking-wider ${getTextMutedColor()} border-b ${getBorderColor()}`}>
                    <tr>
                      <th className="px-4 py-3 text-left">Address</th>
                      <th className="px-4 py-3 text-left">Identifiers</th>
                      <th className="px-4 py-3 text-left">Relevance</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-inherit">
                    {results.map((result, index) => (
                      <tr key={index} className={`hover:${darkMode ? 'bg-[#0057ff]/5' : 'bg-[#0057ff]/5'} transition-colors`}>
                        <td className="px-4 py-4 font-mono text-[#0057ff] text-sm">
                          {result.address}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {result.accounts}
                        </td>
                        <td className="px-4 py-4 text-sm max-w-xs">
                          {result.relevance}
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