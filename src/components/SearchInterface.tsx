'use client';

import { useState, useRef, useEffect } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import AddFrameButton from '@/components/AddFrameButton';
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

export default function SearchInterface() {
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

  // Typewriter effect when searching
  useEffect(() => {
    if (isSearching && typewriterIndex < query.length) {
      const timer = setTimeout(() => {
        setTypewriterText(prev => prev + query.charAt(typewriterIndex));
        setTypewriterIndex(prev => prev + 1);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isSearching, typewriterIndex, query]);

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
              
              // Decode and add to the report content
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
                      }
                    }
                  } catch (e) {
                    // Fallback for non-JSON data
                    const textContent = line.substring(5).trim();
                    if (textContent && textContent !== '[DONE]' && textContent !== ":keep-alive") {
                      reportContent += textContent;
                      setAgentReport(reportContent);
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

  // Toggle dark/light mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Handle successful share
  const handleShareSuccess = (url: string) => {
    setShareUrl(url);
    addLog('Share URL created and copied to clipboard', 'success');
  };

  // Get dynamic background and text colors based on theme
  const bgColor = darkMode ? 'bg-[#0a1020]' : 'bg-[#f5f7fa]';
  const cardBg = darkMode ? 'bg-[#121620]' : 'bg-white';
  const borderColor = darkMode ? 'border-[#2a3343]' : 'border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-800';
  const textMutedColor = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-[#1a2030]' : 'bg-white';
  const placeholderColor = darkMode ? 'placeholder-gray-500' : 'placeholder-gray-400';

  return (
    <div className={`w-full min-h-screen ${bgColor} ${textColor} relative flex flex-col items-center`}>
      {/* Header with Mini App button on left, Follow button on right */}
      <header className="w-full py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          {/* Left side - empty now */}
        </div>
        
        <div className="flex items-center">
          {/* Follow Button (right side) */}
          <AddFrameButton />          
          {/* Theme toggle button */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${darkMode ? 'bg-[#1a2030] hover:bg-[#2a3040]' : 'bg-gray-200 hover:bg-gray-300'} ml-2 transition-colors`}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>
      </header>
      
      {/* Add Sidekick Banner here */}
      <SidekickBanner darkMode={darkMode} />
      
      {/* Main search area */}
      <main className="pt-2 px-6 md:px-14 w-full max-w-5xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Quotient Farcaster Research Agent</h1>
          <p className={`text-sm ${textMutedColor} font-mono`}>Find Your (Onchain) People</p>
        </div>
        
        {/* Search box */}
        <div className={`w-full max-w-3xl mx-auto ${cardBg} rounded-lg border ${borderColor} p-5 shadow-sm mb-6`}>
          <div className="flex items-center mb-3">
            <svg className="w-4 h-4 mr-2 opacity-80" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <div className={`text-xs uppercase tracking-wider ${textMutedColor} font-semibold font-mono`}>Query</div>
          </div>
          
          <form onSubmit={handleSearch} className="mb-3">
            <div className="flex flex-col">
              <textarea
                ref={inputRef}
                value={query}
                onChange={handleInputChange}
                placeholder="e.g. Who is building dev tools for prediction markets...?"
                disabled={isSearching || isAgentProcessing}
                className={`w-full ${inputBg} border ${borderColor} rounded p-4 ${textColor} focus:outline-none focus:ring-1 focus:ring-blue-500 ${placeholderColor} font-mono text-sm resize-none overflow-hidden min-h-[60px]`}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSearch(e);
                  }
                }}
              />
              <div className="flex justify-between mt-2">
                <div className={`text-xs ${textMutedColor} italic`}>
                  Tip: Short, direct queries with descriptive adjectives work best
                </div>
                <button
                  type="submit"
                  disabled={isSearching || isAgentProcessing || !query.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-xs uppercase tracking-wider font-mono hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  Execute
                </button>
              </div>
            </div>
          </form>
          
          {/* Typewriter effect - more subtle */}
          {isSearching && (
            <div className="mt-3 mb-2 font-mono text-sm text-blue-400 border-l-2 border-blue-500 pl-3">
              <span className="inline-block">{typewriterText}</span>
              <span className="inline-block w-1.5 h-3.5 bg-blue-500 ml-0.5 animate-pulse"></span>
            </div>
          )}
          {/* Search status */}
          <div className={`flex items-center mt-3 text-xs ${textMutedColor} font-mono`}>
            {isSearching ? (
              <>
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                <span>Searching...</span>
              </>
            ) : isAgentProcessing ? (
              <>
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></span>
                <span>Analyzing results with agent...</span>
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
          
          {/* Improved logs section - more minimal */}
          {logs.length > 0 && showLogs && (
            <div className={`mt-3 ${darkMode ? 'bg-[#1a2030]' : 'bg-gray-50'} rounded-md p-3 font-mono text-xs`}>
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
                    <span className="opacity-60 mr-2">{log.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
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
      </main>
    </div>
  );
}