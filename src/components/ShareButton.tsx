'use client';

import { useState, useEffect } from 'react';

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
  const [showCopyConfirmation, setShowCopyConfirmation] = useState(false);
  const [showShareConfirmation, setShowShareConfirmation] = useState(false);
  
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
      
      // Show confirmation
      setShowShareConfirmation(true);
      setTimeout(() => setShowShareConfirmation(false), 4000);
      
      // Call the success handler
      onShareSuccess(fullUrl);
      
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setShowCopyConfirmation(true);
      setTimeout(() => setShowCopyConfirmation(false), 2000);
    }
  };
  
  // Get theme-based styles
  const cardBg = darkMode ? 'bg-[#121620]' : 'bg-white';
  const borderColor = darkMode ? 'border-[#2a3343]' : 'border-gray-200';
  
  return (
    <>
      {/* Share button */}
      {!shareUrl && (
        <div className="flex justify-end w-full mb-4 relative">
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
          
          {/* Share success confirmation - enhanced version */}
          {showShareConfirmation && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div className="absolute inset-0 bg-black bg-opacity-30" onClick={() => setShowShareConfirmation(false)}></div>
              <div className={`${darkMode ? 'bg-[#1a1a25] text-white' : 'bg-white text-gray-800'} rounded-xl shadow-xl p-5 max-w-xs w-full mx-auto z-10 transform transition-all animate-fadeIn border ${borderColor}`}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold mb-1">Shared Successfully!</h3>
                  <p className="text-sm opacity-80 mb-3">Link has been copied to your clipboard</p>
                  <button 
                    onClick={() => setShowShareConfirmation(false)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors w-full"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Share URL display */}
      {shareUrl && (
        <div className={`${cardBg} rounded-lg border ${borderColor} p-3 mb-6 flex items-center justify-between`}>
          <div className="font-mono text-sm truncate mr-4">
            {shareUrl}
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <button
                onClick={handleCopyToClipboard}
                className={`p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} rounded transition-colors tooltip`}
                title="Copy to clipboard"
              >
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
              {showCopyConfirmation && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white text-xs py-1.5 px-2.5 rounded shadow-md flex items-center">
                  <svg className="w-3 h-3 mr-1.5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Copied
                </div>
              )}
            </div>
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