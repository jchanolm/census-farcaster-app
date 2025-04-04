// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import SearchInterface from '@/components/SearchInterface';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<{ fid: number; username?: string; displayName?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize the app and hide splash screen
        await sdk.actions.ready();
        
        // Access user information from context
        const context = await sdk.context;
        if (context?.user) {
          setUserData({
            fid: context.user.fid,
            username: context.user.username,
            displayName: context.user.displayName,
          });
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setError('Failed to initialize Farcaster connection.');
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center">
          <div className="mb-4">
            <div className="flex space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-100"></div>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-200"></div>
            </div>
          </div>
          <p className="text-sm text-gray-400 font-mono">Initializing...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white p-6">
        <div className="bg-[#121620] rounded-lg border border-red-800 p-4 max-w-md w-full">
          <div className="flex items-center mb-3">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h2 className="text-lg font-medium text-red-400">Connection Error</h2>
          </div>
          <p className="text-gray-300 mb-4">{error}</p>
          <p className="text-gray-400 text-sm">
            This app requires a connection to Farcaster. Please make sure you're opening this app from Warpcast.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <SearchInterface 
        userFid={userData?.fid} 
        userName={userData?.username} 
        displayName={userData?.displayName} 
      />
    </div>
  );
}