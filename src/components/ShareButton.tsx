'use client';

import { useState } from 'react';

interface ShareButtonProps {
  query: string;
  results: any;
  agentReport: string;
  onShareSuccess: (url: string) => void;
  darkMode: boolean;
  shareUrl: string | null;
}

export default function ShareButton({
  query,
  results,
  agentReport,
  onShareSuccess,
  darkMode,
  shareUrl
}: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  
  // Create shareable URL
  const handleShare = async () => {
    if (isSharing) return;
    
    try {
      setIsSharing(true);
      
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          results,
          agentReport
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create share URL');
      }
      
      const data = await response.json();
      
      // Build the full URL
      const fullUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/s/${data.id}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(fullUrl);
      
      // Call the success handler
      onShareSuccess(fullUrl);
      
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setIsSharing(false);
    }
  };
  
  // Get theme-based styles
  const cardBg = darkMode ? 'bg-[#121620]' : 'bg-white';
  const borderColor = darkMode ? 'border-[#2a3343]' : 'border-gray-200';
  
  return (
    <>
      {/* Share button */}
      {!shareUrl && (
        <div className="flex justify-end w-full mb-4">
          <button
            onClick={handleShare}
            disabled={isSharing}
            className={`bg-blue-600 text-white px-4 py-2 rounded text-xs uppercase tracking-wider font-mono hover:bg-blue-700 transition-colors ${isSharing ? 'opacity-75' : ''}`}
          >
            {isSharing ? (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse mr-2"></span>
                Sharing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 inline-block mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                </svg>
                Share
              </>
            )}
          </button>
        </div>
      )}
      
      {/* Share URL display */}
      {shareUrl && (
        <div className={`${cardBg} rounded-lg border ${borderColor} p-3 mb-6 flex items-center justify-between`}>
          <div className="font-mono text-sm truncate mr-4">
            {shareUrl}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(shareUrl);
              }}
              className={`p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} rounded transition-colors tooltip`}
              title="Copy to clipboard"
            >
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
            <button
              onClick={() => {
                window.open(shareUrl, '_blank');
              }}
              className={`p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} rounded transition-colors tooltip`}
              title="Open in new tab"
            >
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}