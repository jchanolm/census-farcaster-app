'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AgentReport from '@/components/AgentReport';

export default function SharedSearchPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/share/${id}`);
        
        if (!response.ok) {
          throw new Error(response.status === 404 ? 'Shared search not found' : 'Failed to load data');
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [id]);
  
  // Toggle dark/light mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  // Theme variables
  const bgColor = darkMode ? 'bg-[#0a1020]' : 'bg-[#f5f7fa]';
  const cardBg = darkMode ? 'bg-[#121620]' : 'bg-white';
  const borderColor = darkMode ? 'border-[#2a3343]' : 'border-gray-200'; 
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-800';
  const textMutedColor = darkMode ? 'text-gray-400' : 'text-gray-500';
  
  return (
    <div className={`min-h-screen ${bgColor} ${textColor}`}>
      <header className="py-4 px-6 flex justify-between items-center border-b border-gray-800">
        <Link href="/" className="flex items-center">
          <img src="/icon.png" alt="Quotient" className="h-8 w-auto" />
          <span className="ml-2 font-bold text-lg">Quotient</span>
        </Link>
        
        {/* Theme toggle button */}
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-full ${darkMode ? 'bg-[#1a2030] hover:bg-[#2a3040]' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
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
      </header>
      
      <main className="py-8 px-6 max-w-5xl mx-auto">
        {loading ? (
          <div className={`${cardBg} rounded-lg border ${borderColor} p-6 shadow-md`}>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex space-x-2 justify-center mb-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-100"></div>
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-200"></div>
              </div>
              <p className={`text-sm ${textMutedColor}`}>
                Loading shared search...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className={`${cardBg} rounded-lg border border-red-500 p-6 shadow-md`}>
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-xl font-bold text-red-500">Error</h2>
            </div>
            <p className={textMutedColor}>{error}</p>
            <div className="mt-4">
              <Link href="/" className="text-blue-500 hover:text-blue-400">
                Return to home page
              </Link>
            </div>
          </div>
        ) : data ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1">Shared Search Results</h1>
              <p className={`text-sm ${textMutedColor}`}>
                This is a shared search from Quotient
              </p>
            </div>
            
            <div className={`${cardBg} rounded-lg border ${borderColor} p-5 shadow-sm mb-6`}>
              <div className="flex items-center mb-3">
                <svg className="w-4 h-4 mr-2 opacity-80" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <div className={`text-xs uppercase tracking-wider ${textMutedColor} font-semibold font-mono`}>Original Query</div>
              </div>
              
              <div className={`font-mono text-sm border-l-2 border-blue-500 pl-3 py-2 rounded ${textColor}`}>
                {data.query}
              </div>
              
              {data.timestamp && (
                <div className={`mt-3 text-xs ${textMutedColor} font-mono`}>
                  Searched on {new Date(data.timestamp).toLocaleString()}
                </div>
              )}
            </div>
            
            {data.agentReport && (
              <AgentReport 
                report={data.agentReport}
                darkMode={darkMode}
                isLoading={false}
              />
            )}
            
            <div className="mt-6 text-center">
              <Link href="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm">
                Make your own search
              </Link>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}