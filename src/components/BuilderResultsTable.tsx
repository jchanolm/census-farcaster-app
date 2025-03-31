import { useState } from 'react';
import Image from 'next/image';

// Define types within the component for simplicity
interface LinkedAccount {
  username: string;
  platform: string;
}

interface BuilderCredentials {
  farcasterRewards: number;
  smartContracts: number;
  framesDeployed: number;
  channelsModerated: string[];
}

interface Cast {
  hash: string;
  text: string;
  timestamp: string;
  likeCount: number;
  recastCount: number;
  replyCount: number;
  parentUrl?: string;
  authorFid?: string;
}

interface SearchResult {
  username: string;
  bio: string;
  location?: string;
  credentialCount: number
  pfpUrl?: string;
  accounts: LinkedAccount[];
  builderCreds: BuilderCredentials;
  score: number;
}

interface BuilderResultsTableProps {
  results: SearchResult[];
  query: string;
  darkMode: boolean;
}

export default function BuilderResultsTable({ results, query, darkMode }: BuilderResultsTableProps) {
  const [expandedRows, setExpandedRows] = useState<{[key: string]: boolean}>({});
  
  // Styling based on theme
  const bgColorWithOpacity = darkMode ? 'bg-black bg-opacity-80' : 'bg-[#f2f2f5] bg-opacity-90';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-300';
  const textColor = darkMode ? 'text-white' : 'text-[#333]';
  const textMutedColor = darkMode ? 'text-[#aaa]' : 'text-[#777]';
  const hoverBgColor = darkMode ? 'hover:bg-[#0a0a15]' : 'hover:bg-[#f8f8fa]';
  const badgeBgColor = darkMode ? 'bg-[#111122]' : 'bg-[#e9e9ed]';
  const expandedBgColor = darkMode ? 'bg-[#0a0a10]' : 'bg-[#eaeaef]';
  
  // Toggle expanded row
  const toggleRowExpand = (username: string) => {
    setExpandedRows({
      ...expandedRows,
      [username]: !expandedRows[username]
    });
  };
  
  // Score visualization using carets based on relative score range
  const renderScoreGauge = (score: number) => {
    // Find min and max scores from all results
    const minScore = Math.min(...results.map(r => r.score));
    const maxScore = Math.max(...results.map(r => r.score));
    
    // Calculate the relative position in the range (0 to 1)
    // If min and max are the same, default to 1 (prevent division by zero)
    const relativePosition = maxScore === minScore 
      ? 1 
      : (score - minScore) / (maxScore - minScore);
    
    // Determine number of carets based on relative position (1-5)
    // More continuous scale with 5 possible values
    let caretCount;
    if (relativePosition >= 0.9) {
      caretCount = 5; // Top 10% of scores: 5 carets
    } else if (relativePosition >= 0.7) {
      caretCount = 4; // Next 20% of scores: 4 carets
    } else if (relativePosition >= 0.5) {
      caretCount = 3; // Middle 20% of scores: 3 carets
    } else if (relativePosition >= 0.3) {
      caretCount = 2; // Next 20% of scores: 2 carets
    } else {
      caretCount = 1; // Bottom 30% of scores: 1 caret
    }
    // Calculate opacity based on relative position (0.4 to 1.0)
    const opacity = 0.4 + relativePosition * 0.6;
    
    // Determine color intensity based on relative position
    const getBlueShade = () => {
      if (relativePosition >= 0.8) return 'text-blue-700'; // Dark blue for high scores
      if (relativePosition >= 0.4) return 'text-blue-500'; // Medium blue for medium scores
      return 'text-blue-300'; // Light blue for low scores
    };
    
    return (
      <div className="flex items-center">
        <div className="flex space-x-1">
          {[...Array(caretCount)].map((_, i) => (
            <svg 
              key={i}
              className={`h-4 w-4 ${getBlueShade()}`} 
              style={{ opacity: opacity }}
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 2L4 12h6v10h4V12h6L12 2z" />
            </svg>
          ))}
        </div>
        <span className="ml-2 text-xs font-mono">{score.toFixed(3)}</span>
      </div>
    );
  };
  
  // Format large numbers with commas and handle undefined/null/NaN values
  const formatNumber = (num: number | string | undefined | null) => {
    // Handle various possible value types
    if (num === undefined || num === null) return '0';
    
    // Convert to number if it's not already
    const numValue = typeof num === 'number' ? num : Number(num);
    
    // Check if it's a valid number
    if (isNaN(numValue)) return '0';
    
    return numValue.toLocaleString();
  };
  
  // Copy account username to clipboard
  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row expansion when clicking copy button
    navigator.clipboard.writeText(text);
  };
  
  // Format date to readable string
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Unknown date';
    }
  };
  
  // Truncate text with ellipsis
  const truncateText = (text: string, maxLength: number = 200) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  // Helper to render expandable row
  const renderExpandableRow = (result: SearchResult, index: number) => {
    const isExpanded = expandedRows[result.username] || false;
    
    // Ensure builder credentials are numbers
    const builderCreds = {
      smartContracts: typeof result.builderCreds.smartContracts === 'number' 
        ? result.builderCreds.smartContracts 
        : Number(result.builderCreds.smartContracts) || 0,
      framesDeployed: typeof result.builderCreds.framesDeployed === 'number' 
        ? result.builderCreds.framesDeployed 
        : Number(result.builderCreds.framesDeployed) || 0,
      farcasterRewards: typeof result.builderCreds.farcasterRewards === 'number' 
        ? result.builderCreds.farcasterRewards 
        : Number(result.builderCreds.farcasterRewards) || 0,
      channelsModerated: Array.isArray(result.builderCreds.channelsModerated) 
        ? result.builderCreds.channelsModerated 
        : []
    };
    
    return (
      <>
        {/* Main row - always visible */}
        <tr 
          key={`row-${index}`} 
          className={`${hoverBgColor} border-b ${borderColor} cursor-pointer transition-colors duration-150`}
          onClick={() => toggleRowExpand(result.username)}
        >
          {/* Username + PFP */}
          <td className="px-4 py-4">
            <div className="flex items-center space-x-3">
              {result.pfpUrl ? (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-300 relative">
                  <Image 
                    src={result.pfpUrl} 
                    alt={result.username} 
                    width={32} 
                    height={32} 
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-xs">{result.username.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div>
                <div className="font-mono text-[#0057ff] text-sm font-medium">
                  {result.username}
                </div>
                <div className="text-xs text-gray-500">
                  {result.location && (
                    <span className="inline-flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {result.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </td>
          
          {/* Bio */}
          <td className="px-4 py-4 text-sm max-w-xs">
            <div className="line-clamp-2">{result.bio}</div>
          </td>
          
          {/* Credentials Count */}
          <td className="px-4 py-4">
            <div className="flex items-center">
              <span className={`text-sm font-medium ${textColor}`}>
                {formatNumber(result.credentialCount)}
              </span>
            </div>
          </td>
          
          {/* Relevance Score */}
          <td className="px-4 py-4">
            <div className="flex flex-col">
              {renderScoreGauge(result.score)}
            </div>
          </td>
        </tr>
        
        {/* Expanded detail row - only visible when expanded */}
        {isExpanded && (
          <tr key={`detail-${index}`} className={`${expandedBgColor} border-b ${borderColor}`}>
            <td colSpan={4} className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column */}
                <div>
                  <div className="mb-4">
                    <h4 className={`text-xs uppercase tracking-wider ${textMutedColor} font-mono mb-2`}>
                      Builder Credentials
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded ${badgeBgColor}`}>
                        <div className="text-xs text-gray-500 font-mono mb-1">Smart Contracts</div>
                        <div className="text-lg font-medium">{formatNumber(builderCreds.smartContracts)}</div>
                      </div>
                      <div className={`p-3 rounded ${badgeBgColor}`}>
                        <div className="text-xs text-gray-500 font-mono mb-1">Frames Deployed</div>
                        <div className="text-lg font-medium">{formatNumber(builderCreds.framesDeployed)}</div>
                      </div>
                      <div className={`p-3 rounded ${badgeBgColor}`}>
                        <div className="text-xs text-gray-500 font-mono mb-1">FC Rewards</div>
                        <div className="text-lg font-medium">{formatNumber(builderCreds.farcasterRewards)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Channels moderated */}
                  {builderCreds.channelsModerated && builderCreds.channelsModerated.length > 0 && (
                    <div className="mb-4">
                      <h4 className={`text-xs uppercase tracking-wider ${textMutedColor} font-mono mb-2`}>
                        Channels Moderated
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {builderCreds.channelsModerated.map((channel, idx) => (
                          <span 
                            key={idx}
                            className={`text-xs px-2 py-1 rounded ${badgeBgColor} font-mono`}
                          >
                            {channel}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Linked accounts */}
                  {result.accounts && result.accounts.length > 0 && (
                    <div className="mb-4">
                      <h4 className={`text-xs uppercase tracking-wider ${textMutedColor} font-mono mb-2`}>
                        Linked Accounts
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {result.accounts.map((account, idx) => (
                          <div 
                            key={idx}
                            className={`flex items-center justify-between p-2 rounded ${badgeBgColor}`}
                          >
                            <div className="flex items-center">
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                                <span className="text-gray-500 text-xs">{account.platform && account.platform.charAt(0).toUpperCase() || '-'}</span>
                              </div>
                              <div>
                                <div className="text-sm font-medium">{account.username}</div>
                                <div className="text-xs text-gray-500">{account.platform || 'Unknown'}</div>
                              </div>
                            </div>
                            <button 
                              onClick={(e) => copyToClipboard(account.username, e)}
                              className="text-gray-500 hover:text-[#0057ff] transition-colors p-1"
                              title="Copy to clipboard"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Right column - can be used for casts or other data */}
                <div>
                  {/* Add content for right column here if needed */}
                </div>
              </div>
              
              {/* Actions row */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end space-x-2">
                <a
                  href={`https://warpcast.com/${result.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-mono border border-[#0057ff] text-[#0057ff] px-3 py-2 rounded hover:bg-[#0057ff] hover:text-white transition-colors"
                >
                  VIEW PROFILE
                </a>
                <button className="text-xs font-mono bg-[#0057ff] text-white px-3 py-2 rounded">
                  CONNECT
                </button>
              </div>
            </td>
          </tr>
        )}
      </>
    );
  };

  return (
    <div className={`w-full ${bgColorWithOpacity} rounded-lg border ${borderColor} backdrop-blur-sm overflow-hidden`}>
      {/* Results header with count */}
      <div className="flex justify-between items-center p-4 border-b border-inherit">
        <div className="flex items-center">
          <span className="text-sm font-mono font-medium">MATCHED BUILDERS</span>
          <span className="ml-2 bg-[#0057ff] text-white text-xs px-2 py-0.5 rounded-sm font-mono">
            {results.length}
          </span>
        </div>
        <div className="flex">
          <button className="text-xs font-mono text-[#0057ff] border border-blue-500 border-opacity-30 bg-blue-500 bg-opacity-5 px-2 py-1 rounded mr-2 hover:bg-blue-500 hover:bg-opacity-10 transition-colors">
            EXPORT
          </button>
          <button className="text-xs font-mono text-[#0057ff] border border-blue-500 border-opacity-30 bg-blue-500 bg-opacity-5 px-2 py-1 rounded hover:bg-blue-500 hover:bg-opacity-10 transition-colors">
            FILTER
          </button>
        </div>
      </div>
      
      {/* Results summary */}
      <div className={`p-4 border-b ${borderColor} ${textColor}`}>
        <p className="text-sm">
          <strong>{results.length} builder profiles</strong> matched <strong>&quot;{query}&quot;</strong>. 
          Click on a row to expand details.
        </p>
      </div>
      
      {/* Results table */}
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`text-xs font-mono uppercase tracking-wider ${textMutedColor} border-b ${borderColor}`}>
              <tr>
                <th className="px-4 py-3 text-left">Builder</th>
                <th className="px-4 py-3 text-left">Bio</th>
                <th className="px-4 py-3 text-left">Linked Accounts</th>
                <th className="px-4 py-3 text-left">Relevance</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => renderExpandableRow(result, index))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}