'use client';

import { useState, useRef, useEffect } from 'react';
import AgentResults from './AgentResults';
import { processWithAgent } from '@/lib/agentHandler';
import sdk, { initializeFrameSDK } from '@/lib/farcasterSdk';

type LogEntry = {
  message: string;
  type: 'info' | 'error' | 'success' | 'warning';
  timestamp: Date;
};

type SearchResult = {
  username: string;
  bio?: string;
  text?: string;
  nodeType?: string;
  score: number;
  location?: string;
  accounts?: any[];
  builderCreds?: {
    smartContracts?: number;
    framesDeployed?: number;
    farcasterRewards?: number;
    channelsModerated?: string[];
  };
  relevantCasts?: {text: string}[];
  credentialCount?: number;
  pfpUrl?: string;
};

export default function SearchInterface() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAgentProcessing, setIsAgentProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [agentResponse, setAgentResponse] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');
  const [typewriterIndex, setTypewriterIndex] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Add new state for the Farcaster context
  const [farcasterContext, setFarcasterContext] = useState<any>(null);

  // Set light mode by default for Palantir grey vibe
  useEffect(() => {
    setDarkMode(false);
  }, []);

  // Initialize SDK on component mount
  useEffect(() => {
    const initSDK = async () => {
      try {
        // Initialize the SDK
        initializeFrameSDK();
        
        // Store the context (user info, etc.)
        setFarcasterContext(sdk.context);
        
        // Let the Farcaster client know your app is ready to be displayed
        // This will hide the splash screen
        await sdk.actions.ready();
        
        addLog('✅ Connected to Farcaster client', 'success');
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
        addLog('❌ Failed to connect to Farcaster client', 'error');
      }
    };
    
    initSDK();
    
    // Clean up listeners when component unmounts
    return () => {
      sdk.removeAllListeners();
    };
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
  };

  // Handle adding the app to Farcaster client
  const handleAddApp = async () => {
    try {
      addLog('🔄 Requesting to add app to Farcaster client...', 'info');
      const result = await sdk.actions.addFrame();
      
      if (result.added) {
        addLog('✅ App added to Farcaster client', 'success');
      } else {
        addLog(`❌ App not added: ${result.reason}`, 'error');
      }
    } catch (error) {
      console.error('Error adding app:', error);
      addLog('❌ Error adding app to Farcaster client', 'error');
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
    setAgentResponse(null);
    setLogs([]);
    
    addLog(`🔍 Starting search for query: "${query.trim()}"`, 'info');
    
    try {
      addLog('📡 Calling search API...', 'info');
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() })
      });
      
      if (!response.ok) {
        addLog(`❌ Search API error: ${response.status}`, 'error');
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Log detailed structure for first result if available
      if (data.results && data.results.length > 0) {
        const firstResult = data.results[0];
        const castCount = firstResult.relevantCasts?.length || 0;
        
        addLog(`✅ Search complete - found ${data.results.length} results`, 'success');
        addLog(`📊 First result: ${firstResult.username} with ${castCount} relevant casts`, 'info');
        
        if (castCount > 0) {
          // Log sample cast content
          addLog(`📝 Sample cast: "${firstResult.relevantCasts[0].text.substring(0, 50)}${firstResult.relevantCasts[0].text.length > 50 ? '...' : ''}"`, 'info');
        }
      } else {
        addLog(`✅ Search complete - found ${data.results?.length || 0} results`, 'success');
      }
      
      setResults(data.results || []);
      setIsSearching(false);
      setIsCompleted(true);
      
      // Process with agent if we have results
      if (data.results && data.results.length > 0) {
        setIsAgentProcessing(true);
        addLog(`🧠 Starting agent analysis of ${data.results.length} results...`, 'info');
        
        try {
          const agentData = await processWithAgent(query, data.results);
          addLog(`✅ Agent analysis complete - found ${agentData.processedResults?.length || 0} relevant results`, 'success');
          setAgentResponse(agentData);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          addLog(`❌ Agent processing error: ${errorMessage}`, 'error');
          console.error('Agent processing error:', error);
        } finally {
          setIsAgentProcessing(false);
        }
      } else {
        addLog('⚠️ No results to analyze', 'warning');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ Search error: ${errorMessage}`, 'error');
      console.error('Search error:', error);
      setIsSearching(false);
    }
  };

  // Toggle dark/light mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // View profile of a Farcaster user
  const viewFarcasterProfile = async (fid: number) => {
    try {
      await sdk.actions.viewProfile({ fid });
    } catch (error) {
      console.error('Error viewing profile:', error);
    }
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
      {/* Add safe area insets to avoid UI elements being hidden by navigation bars */}
      <div style={{
        marginTop: farcasterContext?.client?.safeAreaInsets?.top || 0,
        marginBottom: farcasterContext?.client?.safeAreaInsets?.bottom || 0,
        marginLeft: farcasterContext?.client?.safeAreaInsets?.left || 0,
        marginRight: farcasterContext?.client?.safeAreaInsets?.right || 0,
      }}>
        {/* Header with theme toggle and add app button */}
        <header className="w-full py-4 px-6 flex justify-between">
          {/* Display user info if available */}
          {farcasterContext?.user && (
            <div className="flex items-center">
              <span className="text-sm font-mono">
                Hello, {farcasterContext.user.username || `FID:${farcasterContext.user.fid}`}
              </span>
            </div>
          )}
          
          <div className="flex items-center">
            {/* Add app button */}
            {farcasterContext && !farcasterContext.client?.added && (
              <button
                onClick={handleAddApp}
                className="mr-4 p-2 rounded bg-[#0057ff] text-white text-xs font-mono"
              >
                ADD APP
              </button>
            )}
            
            {/* Theme toggle button */}
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
          </div>
        </header>
        
        {/* Main search area */}
        <main className="pt-8 px-6 md:px-14 w-full max-w-5xl mx-auto">
          <div className="mb-6 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Quotient</h1>
          </div>
          
          {/* Search box */}
          <div className={`w-full max-w-3xl mx-auto ${bgColorWithOpacity} rounded-lg border ${borderColor} p-5 backdrop-blur-sm mb-6`}>
            <div className="flex items-center mb-3">
              <svg className="w-4 h-4 mr-2 opacity-80" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <div className={`text-xs uppercase tracking-wider ${textMutedColor} font-semibold font-mono`}>Query</div>
            </div>
            
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Find Frame developers building on Base..."
                  disabled={isSearching || isAgentProcessing}
                  className={`w-full ${inputBgWithOpacity} border ${borderColor} rounded p-4 ${textColor} focus:outline-none focus:border-[#0057ff] ${placeholderColor} font-mono text-sm`}
                />
                <button
                  type="submit"
                  disabled={isSearching || isAgentProcessing || !query.trim()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#0057ff] text-white px-4 py-2 rounded text-xs uppercase tracking-wider font-mono hover:bg-[#0046cc] transition-colors disabled:opacity-50 disabled:hover:bg-[#0057ff]"
                >
                  Execute
                </button>
              </div>
            </form>
            
            {/* Typewriter effect - more subtle */}
            {isSearching && (
              <div className="mt-3 mb-2 font-mono text-sm text-opacity-70 text-[#6b8eff] border-l-2 border-[#6b8eff] border-opacity-50 pl-3">
                <span className="inline-block opacity-80">{typewriterText}</span>
                <span className="inline-block w-1.5 h-3.5 bg-[#6b8eff] ml-0.5 animate-pulse opacity-60"></span>
              </div>
            )}
            
            {/* Search status */}
            <div className={`flex items-center mt-3 text-xs ${textMutedColor} font-mono`}>
              {isSearching ? (
                <>
                  <span className="w-2 h-2 bg-[#0057ff] rounded-full mr-2"></span>
                  <span>Scanning builder constellation...</span>
                </>
              ) : isAgentProcessing ? (
                <>
                  <span className="w-2 h-2 bg-[#9c27b0] rounded-full mr-2"></span>
                  <span>Analyzing results with agent...</span>
                </>
              ) : isCompleted ? (
                <>
                  <span className="w-2 h-2 bg-[#27c93f] rounded-full mr-2"></span>
                  <span>Query completed. {agentResponse?.processedResults?.length || 0} relevant builders found.</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  <span>Ready for query.</span>
                </>
              )}
            </div>
          </div>
          
          {/* Logs section */}
          {logs.length > 0 && (
            <div className={`w-full mb-6 ${bgColorWithOpacity} rounded-lg border ${borderColor} p-4 backdrop-blur-sm`}>
              <div className="flex items-center mb-2">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs uppercase tracking-wider font-mono">System Logs</span>
              </div>
              <div className="bg-gray-900 text-gray-100 font-mono text-xs p-3 rounded h-48 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    <span className="opacity-70">[{log.timestamp.toLocaleTimeString()}]</span> {log.message}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          )}
          
          {/* Agent Results */}
          {isCompleted && !isAgentProcessing && agentResponse && (
            <AgentResults 
              agentResponse={agentResponse}
              darkMode={darkMode}
            />
          )}
        </main>
      </div>
    </div>
  );
}