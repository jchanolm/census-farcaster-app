import React, { useState } from 'react';

interface SearchResult {
  username: string;
  bio?: string;
  castText?: string[];
  totalScore?: number;
}

interface SimpleResultsTableProps {
  results: SearchResult[];
  query: string;
  darkMode: boolean;
}

export default function SimpleResultsTable({ results, query, darkMode }: SimpleResultsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  
  // Styling based on theme
  const bgColor = darkMode ? 'bg-gray-900' : 'bg-white';
  const textColor = darkMode ? 'text-white' : 'text-gray-800';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const expandedBgColor = darkMode ? 'bg-gray-800' : 'bg-gray-50';
  
  // Toggle expanded row
  const toggleRowExpand = (username: string) => {
    setExpandedRows({
      ...expandedRows,
      [username]: !expandedRows[username]
    });
  };
  
  if (!results || results.length === 0) {
    return (
      <div className={`w-full ${bgColor} p-4 rounded ${textColor} text-center border ${borderColor}`}>
        No results found for "{query}"
      </div>
    );
  }

  return (
    <div className={`w-full ${bgColor} rounded border ${borderColor} overflow-hidden`}>
      <div className="p-3 border-b border-inherit">
        <p className={`text-sm ${textColor}`}>
          {results.length} builders found for "{query}"
        </p>
      </div>
      
      <table className="w-full">
        <thead className="text-xs uppercase">
          <tr className={`border-b ${borderColor}`}>
            <th className="px-3 py-2 text-left">Username</th>
            <th className="px-3 py-2 text-left">Bio</th>
            <th className="px-3 py-2 text-left">Relevance</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => {
            const isExpanded = expandedRows[result.username] || false;
            const hasCasts = result.castText && result.castText.length > 0;
            
            return (
              <React.Fragment key={result.username}>
                <tr 
                  className={`border-b ${borderColor} cursor-pointer hover:bg-opacity-10 hover:bg-blue-500`}
                  onClick={() => toggleRowExpand(result.username)}
                >
                  <td className="px-3 py-2 font-medium text-blue-500">
                    {result.username}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <div className="line-clamp-2">{result.bio || 'No bio'}</div>
                  </td>
                  <td className="px-3 py-2 text-sm">
                    Score: {result.totalScore?.toFixed(2) || '0.00'}
                  </td>
                </tr>
                
                {isExpanded && (
                  <tr className={`border-b ${borderColor} ${expandedBgColor}`}>
                    <td colSpan={3} className="px-4 py-3">
                      <div className="text-sm mb-2">
                        <strong>Relevance Context:</strong> {result.username} matches "{query}" 
                        {hasCasts 
                          ? ` with ${result.castText.length} relevant cast${result.castText.length > 1 ? 's' : ''} and a score of ${result.totalScore?.toFixed(2) || '0.00'}.`
                          : ` based on profile data with a score of ${result.totalScore?.toFixed(2) || '0.00'}.`
                        }
                      </div>
                      
                      {hasCasts && (
                        <div className="mt-3">
                          <div className="text-xs font-medium uppercase mb-2">Relevant Casts:</div>
                          <div className="space-y-2 max-h-80 overflow-y-auto">
                            {result.castText.map((cast, idx) => (
                              <div 
                                key={idx} 
                                className={`text-sm p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} border ${borderColor}`}
                              >
                                {cast}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {!hasCasts && (
                        <div className="mt-3 text-sm italic text-gray-500">
                          No casts found for this user that match your query.
                        </div>
                      )}
                      
                      <div className="mt-3 text-right">
                        <a 
                          href={`https://warpcast.com/${result.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          View Profile
                        </a>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}