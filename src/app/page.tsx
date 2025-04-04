'use client';

import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import SearchInterface from '@/components/SearchInterface';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<{ fid: number; username?: string; displayName?: string } | null>(null);

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
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a1020] text-white">
        <div className="flex flex-col items-center">
          <div className="mb-4 flex space-x-2 justify-center">
            <div className="w-2 h-2 rounded-full bg-[#0057ff] animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-[#0057ff] animate-pulse delay-100"></div>
            <div className="w-2 h-2 rounded-full bg-[#0057ff] animate-pulse delay-200"></div>
          </div>
          <p className="text-sm text-gray-400 font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-6 py-8 bg-[#0a1020] text-white min-h-screen">
      {userData ? (
        <SearchInterface userFid={userData.fid} userName={userData.username} displayName={userData.displayName} />
      ) : (
        <div className="text-center bg-[#121620] rounded-lg border border-[#2a3343] p-6 shadow-sm">
          <p className="text-sm text-gray-500 font-mono">Unable to get your Farcaster information. Please try again.</p>
        </div>
      )}
    </main>
  );
}