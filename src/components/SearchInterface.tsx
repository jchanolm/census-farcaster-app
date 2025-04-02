'use client';

import { useState, useRef, useEffect } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import AddFrameButton from '@/components/AddFrameButton';
import SidekickBanner from '@/components/SidekickBanner';
import ReactMarkdown from 'react-markdown';

type LogEntry = {
  message: string;
  type: 'info' | 'error' | 'success' | 'warning';
  timestamp: Date;
};

type SearchResult = {
  username: string;
  bio?: string;
  text?: string;
  castText?: string[];
  totalScore?: number;
  [key: string]: any;
};

function AgentReport({ report, darkMode, isLoading }) {
  if (isLoading) {
    return (
      <div className={`${darkMode ? 'bg-black bg-opacity-80' : 'bg-[#f2f2f5] bg-opacity-90'} rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-300'} p-5 backdrop-blur-sm mb-6 w-full`}>
        <div className="flex items-center mb-3">
          <div className="w-4 h-4 mr-2 rounded-full bg-[#0057ff] opacity-80 animate-pulse"></div>
          <div className={`text-xs uppercase tracking-wider ${darkMode ? 'text-[#aaa]' : 'text-[#777]'} font-semibold font-mono`}>
            ANALYSIS
          </div>
        </div>
        
        <div className="my-6 flex flex-col items-center py-4">
          <div className="flex space-x-2 justify-center mb-3">
            <div className="w-2 h-2 rounded-full bg-[#0057ff] opacity-60 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-[#0057ff] opacity-60 animate-pulse delay-100"></div>
            <div className="w-2 h-2 rounded-full bg-[#0057ff] opacity-60 animate-pulse delay-200"></div>
          </div>
          <p className={`text-sm ${darkMode ? 'text-[#aaa]' : 'text-[#777]'}`}>
            Generating report...
          </p>
        </div>
      </div>
    );
  }
  
  if (!report) return null;
  
  // Use higher contrast text colors based on dark mode
  const headerColor = darkMode ? 'text-[#88b3ff]' : 'text-[#0046cc]'; // Lighter blue for dark mode, darker blue for light mode
  const accentColor = darkMode ? 'text-white' : 'text-[#0046cc]'; // White text for dark mode, dark blue for light mode
  
  // Custom renderer for React Markdown components
  const components = {
    // Headings
    h1: ({node, ...props}) => <h1 className={`${headerColor} font-mono text-lg uppercase tracking-wider font-medium my-3`} {...props} />,
    h2: ({node, ...props}) => <h2 className={`${headerColor} font-mono text-md uppercase tracking-wider font-medium my-3`} {...props} />,
    h3: ({node, ...props}) => <h3 className={`${headerColor} font-mono text-sm uppercase tracking-wider font-medium my-3`} {...props} />,
    
    // Links (for @username mentions)
    a: ({node, ...props}) => {
      // Check if this is a username mention
      if (props.href?.startsWith('https://warpcast.com/')) {
        return <a className={`${accentColor} font-mono hover:underline`} target="_blank" {...props} />;
      }
      return <a className={`${accentColor} hover:underline`} target="_blank" {...props} />;
    },
    
    // Lists with custom styling
    li: ({node, ...props}) => {
      return (
        <li className="flex items-start mb-2">
          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${darkMode ? 'bg-[#88b3ff] bg-opacity-20 text-[#88b3ff]' : 'bg-[#0046cc] bg-opacity-10 text-[#0046cc]'} text-xs font-medium mr-3 flex-shrink-0`}>•</span>
          <span>{props.children}</span>
        </li>
      );
    },
    
    // Add horizontal rule styling
    hr: ({node, ...props}) => <hr className="my-4 border-t border-gray-700" {...props} />,
    
    // Custom paragraphs
    p: ({node, ...props}) => <p className="mb-3" {...props} />,
    
    // Bold text
    strong: ({node, ...props}) => <strong className={`${accentColor} font-semibold`} {...props} />
  };
  
  // Process username mentions before passing to ReactMarkdown
  const processedReport = report.replace(/@([a-zA-Z0-9_]+)/g, '[@$1](https://warpcast.com/$1)');
  
  return (
    <div className={`${darkMode ? 'bg-black bg-opacity-80' : 'bg-[#f2f2f5] bg-opacity-90'} rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-300'} p-5 backdrop-blur-sm mb-6 w-full`}>
      <div className="flex items-center mb-5">
        <div className="w-4 h-4 mr-2 bg-[#0057ff] rounded-sm"></div>
        <div className={`text-xs uppercase tracking-wider ${darkMode ? 'text-[#aaa]' : 'text-[#777]'} font-semibold font-mono`}>
          INTELLIGENCE REPORT
        </div>
      </div>
      
      <div className={`text-sm ${darkMode ? 'text-white' : 'text-[#333]'} font-sans leading-relaxed`}>
        <ReactMarkdown components={components}>
          {processedReport}
        </ReactMarkdown>
      </div>
    </div>
  );
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
  const [results, setResults] = useState<SearchResult[]>([]);
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
      
      // Log basic results
      if (data.results && data.results.length > 0) {
        addLog(`Search complete - found ${data.results.length} results`, 'success');
        
        // Sample logging for first result
        const firstResult = data.results[0];
        addLog(`First result: ${firstResult.username || 'Unknown'}`, 'info');
      } else {
        addLog(`Search complete - found ${data.results?.length || 0} results`, 'success');
      }
      
      setResults(data.results || []);
      setIsSearching(false);
      setIsCompleted(true);
      
      // Process with agent if we have results
      if (data.results && data.results.length > 0) {
        setIsAgentProcessing(true);
        addLog(`Starting agent analysis of ${data.results.length} results...`, 'info');
        
        try {
          // Call the agent API directly to get the streaming response
          const agentResponse = await fetch('/api/agent/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query, results: data.results }),
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
                    
                    const jsonData = JSON.parse(content);
                    if (jsonData.choices && jsonData.choices[0].delta && jsonData.choices[0].delta.content) {
                      const textChunk = jsonData.choices[0].delta.content;
                      reportContent += textChunk;
                      setAgentReport(reportContent);
                    }
                  } catch (e) {
                    // Fallback for non-JSON data
                    const textContent = line.substring(5).trim();
                    if (textContent && textContent !== '[DONE]') {
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

  // Get dynamic background and text colors based on theme
  const bgColorWithOpacity = darkMode ? 'bg-black bg-opacity-80' : 'bg-[#f2f2f5] bg-opacity-90';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-300';
  const textColor = darkMode ? 'text-white' : 'text-[#333]';
  const textMutedColor = darkMode ? 'text-[#aaa]' : 'text-[#777]';
  const inputBgWithOpacity = darkMode ? 'bg-[#0a0a10] bg-opacity-70' : 'bg-white bg-opacity-80';
  const placeholderColor = darkMode ? 'placeholder-[#666]' : 'placeholder-[#999]';

  return (
    <div className={`w-full min-h-screen ${darkMode ? 'bg-black' : 'bg-[#e5e5e8]'} ${textColor} relative flex flex-col items-center`}>
      {/* Header with theme toggle and Add Frame button */}
      <header className="w-full py-4 px-6 flex justify-end items-center">
       <AddFrameButton />
        
        {/* Theme toggle button */}
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} ml-2`}
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
      
      {/* Add Sidekick Banner here */}
      <SidekickBanner darkMode={darkMode} />
      
      {/* Main search area */}
      <main className="pt-2 px-6 md:px-14 w-full max-w-5xl mx-auto">
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
            <div className="flex flex-col">
              <textarea
                ref={inputRef}
                value={query}
                onChange={handleInputChange}
                placeholder="e.g. Which Farcaster frames / mini apps devs should Balaji reach out to for Network School...?"
                disabled={isSearching || isAgentProcessing}
                className={`w-full ${inputBgWithOpacity} border ${borderColor} rounded p-4 ${textColor} focus:outline-none focus:border-[#0057ff] ${placeholderColor} font-mono text-sm resize-none overflow-hidden min-h-[60px]`}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSearch(e);
                  }
                }}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={isSearching || isAgentProcessing || !query.trim()}
                  className="bg-[#0057ff] text-white px-4 py-2 rounded text-xs uppercase tracking-wider font-mono hover:bg-[#0046cc] transition-colors disabled:opacity-50 disabled:hover:bg-[#0057ff]"
                >
                  Execute
                </button>
              </div>
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
                <span>Scanning builders...</span>
              </>
            ) : isAgentProcessing ? (
              <>
                <span className="w-2 h-2 bg-[#9c27b0] rounded-full mr-2"></span>
                <span>Analyzing results with agent...</span>
              </>
            ) : isCompleted ? (
              <>
                <span className="w-2 h-2 bg-[#27c93f] rounded-full mr-2"></span>
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
                  <span className="opacity-70">[{log.timestamp.toLocaleTimeString()}]</span>{' '}
                  {log.type === 'error' && <span className="text-red-400">ERROR: </span>}
                  {log.type === 'warning' && <span className="text-yellow-400">WARNING: </span>}
                  {log.type === 'success' && <span className="text-green-400">SUCCESS: </span>}
                  {log.message}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}
        
        {/* Agent Results */}
        {(isAgentProcessing || agentReport) && (
          <AgentReport 
            report={agentReport}
            darkMode={darkMode}
            isLoading={isAgentProcessing && !agentReport}
          />
        )}
      </main>
    </div>
  );
}