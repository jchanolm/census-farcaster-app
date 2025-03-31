import React from 'react';
import Image from 'next/image';

export default function AgentResults({ agentResponse, darkMode }) {
  if (!agentResponse || !agentResponse.processedResults) return null;
  
  // Styling based on theme
  const bgColorWithOpacity = darkMode ? 'bg-black bg-opacity-80' : 'bg-[#f2f2f5] bg-opacity-90';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-300';
  const cardBgColor = darkMode ? 'bg-[#0a0a15]' : 'bg-[#fff]';
  const cardBorderColor = darkMode ? 'border-gray-800' : 'border-gray-200';
  
  return (
    <div className={`w-full ${bgColorWithOpacity} rounded-lg border ${borderColor} p-5 backdrop-blur-sm mb-6`}>
      {/* Results header */}
      <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2 text-[#0057ff]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"></path>
          </svg>
          <div className="text-sm font-mono font-medium">AGENT ANALYSIS</div>
          <span className="ml-2 bg-[#0057ff] text-white text-xs px-2 py-0.5 rounded-sm font-mono">
            {agentResponse.processedResults.length}
          </span>
        </div>
      </div>

      {/* Summary section */}
      <div className="mb-4 p-4 rounded bg-opacity-10 bg-blue-500 border border-blue-500 border-opacity-20">
        <h3 className="text-sm font-medium mb-2 text-blue-500">Summary</h3>
        <p className="text-sm">{agentResponse.summary}</p>
      </div>
      
      {/* Key Takeaways */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2 text-blue-500">Key Takeaways</h3>
        <ul className="space-y-1">
          {agentResponse.keyTakeaways.map((takeaway, idx) => (
            <li key={idx} className="flex items-start text-sm">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 bg-opacity-10 text-blue-500 text-xs font-medium mr-2 flex-shrink-0">
                {idx + 1}
              </span>
              <span>{takeaway}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Relevant builders */}
      <h3 className="text-sm font-medium mb-3 text-blue-500">Relevant Builders</h3>
      <div className="space-y-4">
        {agentResponse.processedResults.map((result, idx) => (
          <div key={idx} className={`p-4 rounded border ${cardBorderColor} ${cardBgColor}`}>
            <div className="flex items-center mb-2">
              {/* Builder avatar */}
              {result.pfpUrl ? (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-300 mr-3">
                  <Image 
                    src={result.pfpUrl} 
                    alt={result.username} 
                    width={32} 
                    height={32} 
                    className="object-cover"
                    unoptimized={true}
                    onError={(e) => {
                      e.currentTarget.src = `https://avatar.vercel.sh/${result.username}`;
                    }}
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                  <span className="text-gray-500 text-xs">{result.username.charAt(0).toUpperCase()}</span>
                </div>
              )}
              
              {/* Builder name/username */}
              <div>
                <div className="font-mono text-[#0057ff] text-sm font-medium">
                  {result.username}
                </div>
                <div className="text-xs text-gray-500">
                  {result.location || 'Location unknown'}
                </div>
              </div>
              
              {/* View profile link */}
              <div className="ml-auto">
                <a
                  href={`https://warpcast.com/${result.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono border border-[#0057ff] text-[#0057ff] px-2 py-1 rounded hover:bg-[#0057ff] hover:text-white transition-colors"
                >
                  VIEW
                </a>
              </div>
            </div>
            
            {/* Relevance context */}
            <div className="mt-2 text-sm border-l-2 border-blue-500 pl-3 py-1">
              {result.relevanceContext}
            </div>
            
            {/* Bio */}
            <div className="mt-3 text-xs text-gray-500">
              {result.bio}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}