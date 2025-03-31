import { useState } from 'react';

export default function AgentInsights({ agentResponse, darkMode, isLoading }) {
  const [expanded, setExpanded] = useState(true);
  
  if (!agentResponse && !isLoading) return null;
  
  // Styling based on theme
  const bgColorWithOpacity = darkMode ? 'bg-black bg-opacity-80' : 'bg-[#f2f2f5] bg-opacity-90';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-300';
  const textColor = darkMode ? 'text-white' : 'text-[#333]';
  const textMutedColor = darkMode ? 'text-[#aaa]' : 'text-[#777]';
  const insightCardBg = darkMode ? 'bg-[#0a0a15]' : 'bg-[#fff]';
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  // Loader appearance during processing
  const renderLoader = () => (
    <div className={`${bgColorWithOpacity} rounded-lg border ${borderColor} p-5 backdrop-blur-sm mb-6 w-full`}>
      <div className="flex items-center mb-3">
        <div className="w-4 h-4 mr-2 rounded-full bg-[#0057ff] opacity-80 animate-pulse"></div>
        <div className={`text-xs uppercase tracking-wider ${textMutedColor} font-semibold font-mono`}>
          QUOTIENT ANALYSIS
        </div>
      </div>
      
      <div className="my-6 flex flex-col items-center py-4">
        <div className="flex space-x-2 justify-center mb-3">
          <div className="w-2 h-2 rounded-full bg-[#0057ff] opacity-60 animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-[#0057ff] opacity-60 animate-pulse delay-100"></div>
          <div className="w-2 h-2 rounded-full bg-[#0057ff] opacity-60 animate-pulse delay-200"></div>
        </div>
        <p className={`text-sm ${textMutedColor}`}>
          Processing results with intelligence agent...
        </p>
      </div>
    </div>
  );
  
  if (isLoading) {
    return renderLoader();
  }
  
  if (!agentResponse) return null;
  
  return (
    <div className={`${bgColorWithOpacity} rounded-lg border ${borderColor} p-5 backdrop-blur-sm mb-6 w-full`}>
      {/* Header with expand/collapse control */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2 text-[#0057ff]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"></path>
          </svg>
          <div className={`text-xs uppercase tracking-wider ${textMutedColor} font-semibold font-mono`}>
            QUOTIENT ANALYSIS
          </div>
        </div>
        <button 
          onClick={toggleExpanded}
          className="p-1 rounded-md hover:bg-gray-200 hover:bg-opacity-20 transition-colors"
        >
          {expanded ? (
            <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>
      
      {expanded && (
        <div className="space-y-4">
          {/* Summary section */}
          <div className={`${insightCardBg} p-4 rounded-md border ${borderColor} border-opacity-50`}>
            <h3 className={`text-sm font-medium mb-2 ${textColor}`}>Summary</h3>
            <p className={`text-sm ${textColor}`}>{agentResponse.summary}</p>
          </div>
          
          {/* Key Takeaways section */}
          <div className={`${insightCardBg} p-4 rounded-md border ${borderColor} border-opacity-50`}>
            <h3 className={`text-sm font-medium mb-2 ${textColor}`}>Key Takeaways</h3>
            <ul className="space-y-2">
              {agentResponse.keyTakeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0057ff] bg-opacity-10 text-[#0057ff] text-xs font-medium mr-2">
                    {idx + 1}
                  </span>
                  <span className={`text-sm ${textColor}`}>{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}