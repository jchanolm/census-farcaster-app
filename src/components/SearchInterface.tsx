'use client';

import { useState, useRef, useEffect } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import SidekickBanner from '@/components/SidekickBanner';
import AgentReport from './AgentReport';
import ShareButton from './ShareButton';

type LogEntry = {
  message: string;
  type: 'info' | 'error' | 'success' | 'warning';
  timestamp: Date;
};

type SearchResult = {
  results?: {
    accounts?: {
      username: string;
      bio?: string;
      followerCount?: number;
      fcCred?: number;
      state?: string;
      city?: string;
      country?: string;
      score?: number;
      profileUrl?: string;
      [key: string]: any;
    }[];
    casts?: {
      username: string;
      text?: string;
      castContent?: string;
      timestamp?: string;
      likesCount?: number;
      mentionedChannels?: string[];
      mentionedUsers?: string[];
      score?: number;
      castUrl?: string;
      authorProfileUrl?: string;
      [key: string]: any;
    }[];
  };
  query?: string;
  [key: string]: any;
};

/**
 * Extract all usernames from search results
 */
function extractUsernames(results: SearchResult): string[] {
  const usernames: string[] = [];
  
  // Extract from accounts
  if (results?.results?.accounts && Array.isArray(results.results.accounts)) {
    results.results.accounts.forEach(account => {
      if (account.username) usernames.push(account.username);
    });
  }
  
  // Extract from casts
  if (results?.results?.casts && Array.isArray(results.results.casts)) {
    results.results.casts.forEach(cast => {
      if (cast.username) usernames.push(cast.username);
      
      // Also add mentioned users
      if (cast.mentionedUsers && Array.isArray(cast.mentionedUsers)) {
        cast.mentionedUsers.forEach(user => {
          if (typeof user === 'string') usernames.push(user);
        });
      }
    });
  }
  
  return Array.from(new Set(usernames));
}

export default function SearchInterface({ userFid, userName, displayName }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAgentProcessing, setIsAgentProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [agentReport, setAgentReport] = useState<string>('');
  const [darkMode, setDarkMode] = useState(true);
  const [typewriterText, setTypewriterText] = useState('');
  const [typewriterIndex, setTypewriterIndex] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [results, setResults] = useState<SearchResult>({});
  const [showLogs, setShowLogs] = useState(false);
  const [expandLogs, setExpandLogs] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Set dark mode by default
  useEffect(() => {
    setDarkMode(true);
  }, []);

  // Focus the input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Scroll logs to bottom when new logs are added
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Typewriter effect when searching - faster speed (50ms instead of 100ms)
  useEffect(() => {
    if (isSearching && typewriterIndex < query.length) {
      const timer = setTimeout(() => {
        setTypewriterText(prev => prev + query.charAt(typewriterIndex));
        setTypewriterIndex(prev => prev + 1);
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [isSearching, typewriterIndex, query]);

  // Countdown timer effect
  useEffect(() => {
    if (countdownSeconds !== null && countdownSeconds > 0) {
      const timer = setTimeout(() => {
        setCountdownSeconds(countdownSeconds - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [countdownSeconds]);

  // Add a log entry
  const addLog = (message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date() }]);
    setShowLogs(true);
  };

  // Handle input change and auto-resize
  const handleInputChange = (e) => {
    setQuery(e.target.value);
    
    // Auto-resize the input
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  };

  // Handle adding the frame
  const handleAddFrame = async () => {
    try {
      await sdk.actions.addFrame();
      console.log('App was added successfully');
      addLog('App was added to Warpcast', 'success');
    } catch (error) {
      console.error('Failed to add frame:', error);
      addLog('Failed to add app to Warpcast', 'error');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;
    
    // Reset state
    setIsSearching(true);
    setIsCompleted(false);
    setTypewriterText('');
    setTypewriterIndex(0);
    setAgentReport('');
    setLogs([]);
    setShowLogs(true);
    setShareUrl(null);
    
    addLog(`Starting search for query: "${query.trim()}"`, 'info');
    
    try {
      addLog('Calling search API...', 'info');
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() })
      });
      
      if (!response.ok) {
        addLog(`Search API error: ${response.status}`, 'error');
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Log basic results (updated for structured format)
      const accountsCount = data.results?.accounts?.length || 0;
      const castsCount = data.results?.casts?.length || 0;
      
      if (accountsCount > 0 || castsCount > 0) {
        addLog(`Search complete - found ${accountsCount} accounts and ${castsCount} casts`, 'success');
        
        // Sample logging for first account result if available
        if (accountsCount > 0) {
          const firstAccount = data.results.accounts[0];
          addLog(`Top account match: ${firstAccount.username || 'Unknown'}`, 'info');
        }
        
        // Sample logging for first cast result if available
        if (castsCount > 0) {
          const firstCast = data.results.casts[0];
          addLog(`Top cast match: from ${firstCast.username || 'Unknown'}`, 'info');
        }
      } else {
        addLog(`Search complete - no matching accounts or casts found`, 'warning');
      }
      
      setResults(data || { results: { accounts: [], casts: [] } });
      setIsSearching(false);
      setIsCompleted(true);
      
      // Process with agent if we have any results
      if (accountsCount > 0 || castsCount > 0) {
        setIsAgentProcessing(true);
        addLog(`Starting agent analysis of ${accountsCount} accounts and ${castsCount} casts...`, 'info');
        // Start countdown from 15 seconds
        setCountdownSeconds(15);
        
        try {
          // Call the agent API with the structured format
          const agentResponse = await fetch('/api/agent/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              originalQuery: query, 
              query: data.query,
              results: data.results 
            }),
          });
          
          if (!agentResponse.ok) {
            throw new Error(`Agent API error: ${agentResponse.status}`);
          }
          
          // Process the streaming response
          const reader = agentResponse.body?.getReader();
          const decoder = new TextDecoder();
          
          if (reader) {
            let reportContent = '';
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              // Decode and add to the content
              const chunk = decoder.decode(value, { stream: true });
              
              // Parse SSE format
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.startsWith('data:')) {
                  try {
                    const content = line.substring(5).trim();
                    if (content === '[DONE]') continue;
                    if (content === ':keep-alive') continue;
                    
                    const jsonData = JSON.parse(content);
                    if (jsonData.choices && jsonData.choices[0].delta && jsonData.choices[0].delta.content) {
                      const textChunk = jsonData.choices[0].delta.content;
                      // Filter out ":keep-alive" from the streaming text
                      if (textChunk !== ":keep-alive") {
                        reportContent += textChunk;
                        setAgentReport(reportContent);
                        // Clear countdown once we start getting report content
                        if (countdownSeconds !== null) {
                          setCountdownSeconds(null);
                        }
                      }
                    }
                  } catch (e) {
                    // Fallback for non-JSON data
                    const textContent = line.substring(5).trim();
                    if (textContent && textContent !== '[DONE]' && textContent !== ":keep-alive") {
                      reportContent += textContent;
                      setAgentReport(reportContent);
                      // Clear countdown once we start getting report content
                      if (countdownSeconds !== null) {
                        setCountdownSeconds(null);
                      }
                    }
                  }
                }
              }
            }
            
            addLog(`Agent analysis complete - generated report`, 'success');
          }
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          addLog(`Agent processing error: ${errorMessage}`, 'error');
          console.error('Agent processing error:', error);
        } finally {
          setIsAgentProcessing(false);
          setCountdownSeconds(null);
        }
      } else {
        addLog('No results to analyze', 'warning');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Search error: ${errorMessage}`, 'error');
      console.error('Search error:', error);
      setIsSearching(false);
    }
  };

  // Handle successful share
  const handleShareSuccess = (url: string) => {
    setShareUrl(url);
    addLog('Share URL created and copied to clipboard', 'success');
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
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold mb-1">Quotient</h1>
          <p className={`text-sm ${mutedTextColor}`}>
            Farcaster Research Agent
          </p>
          {userName && (
            <p className={`text-xs ${mutedTextColor} font-mono mt-2`}>
              Welcome, {displayName || userName || 'Explorer'}
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
                disabled={isSearching || isAgentProcessing}
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
                disabled={isSearching || isAgentProcessing || !query.trim()}
                className={`absolute right-3 bottom-3 rounded-lg p-2 transition-colors focus:outline-none
                ${isSearching || isAgentProcessing || !query.trim() 
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
          
          {/* Typewriter effect - for when searching */}
          {isSearching && (
            <div className="mt-3 mb-2 font-mono text-sm text-blue-400 border-l-2 border-blue-500 pl-3 overflow-hidden">
              <span className="inline-block">{typewriterText}</span>
              <span className="inline-block w-1.5 h-3.5 bg-blue-500 ml-0.5 animate-pulse"></span>
            </div>
          )}
          
          {/* Search status */}
          <div className={`flex items-center text-xs ${mutedTextColor} mt-3`}>
            {isSearching ? (
              <>
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                <span>Searching...</span>
              </>
            ) : isAgentProcessing ? (
              <>
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></span>
                <span>Analyzing results with agent...</span>
                {countdownSeconds !== null && (
                  <span className="ml-1 text-purple-400">
                    (expected in {countdownSeconds}s)
                  </span>
                )}
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
          
          {/* Logs section */}
          {logs.length > 0 && showLogs && (
            <div className={`mt-3 ${darkMode ? 'bg-[#1a1a25]' : 'bg-gray-50'} rounded-lg p-3 font-mono text-xs`}>
              {/* Show just the most recent log, or all if expanded */}
              {(expandLogs ? logs : logs.slice(-1)).map((log, index) => {
                let logColor;
                let logIcon;
                
                switch(log.type) {
                  case 'error':
                    logColor = darkMode ? 'text-red-300' : 'text-red-600';
                    logIcon = '✕';
                    break;
                  case 'warning':
                    logColor = darkMode ? 'text-yellow-300' : 'text-yellow-600';
                    logIcon = '⚠';
                    break;
                  case 'success':
                    logColor = darkMode ? 'text-green-300' : 'text-green-600';
                    logIcon = '✓';
                    break;
                  default:
                    logColor = darkMode ? 'text-blue-300' : 'text-blue-600';
                    logIcon = '•';
                }
                
                return (
                  <div key={index} className={`mb-1 flex items-start ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className={`${logColor} mr-1`}>{logIcon}</span>
                    <span className="opacity-60 mr-2 text-xs">
                      {log.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                    </span>
                    <span className={log.type === 'error' ? logColor : ''}>{log.message}</span>
                  </div>
                );
              })}
              
              {/* Toggle for showing more logs */}
              {logs.length > 1 && (
                <div className="mt-1 flex justify-between items-center">
                  <button 
                    onClick={() => setExpandLogs(!expandLogs)}
                    className={`text-xs ${darkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-500'} transition-colors focus:outline-none`}
                  >
                    {expandLogs ? 'Show less' : `+${logs.length - 1} more`}
                  </button>
                  
                  <button 
                    onClick={() => setShowLogs(false)}
                    className={`text-xs ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-400'} transition-colors focus:outline-none`}
                  >
                    ×
                  </button>
                </div>
              )}
              
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
        
        {/* Agent Results */}
        {(isAgentProcessing || agentReport) && (
          <AgentReport 
            report={agentReport}
            darkMode={darkMode}
            isLoading={isAgentProcessing && !agentReport}
          />
        )}
        
        {/* Share Button */}
        {agentReport && !isAgentProcessing && (
          <ShareButton 
            query={query}
            results={results}
            agentReport={agentReport}
            onShareSuccess={handleShareSuccess}
            darkMode={darkMode}
            shareUrl={shareUrl}
          />
        )}
        
        {/* Support banner at bottom */}
        <div className="mt-auto pt-4">
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